// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error InvalidAddress();
error MismatchingData();
error NoMilestones();
error OnlyClient();
error OnlyFreelancer();
error OnlyInvolvedParties();
error AlreadyFunded();
error IncorrectFunding();
error MilestoneNotFunded();
error MilestoneNotSubmitted();
error CannotDispute();
error NotInDispute();
error TransferFailed();

/**
 * @title FreelanceEscrow
 * @dev Optimized and hardened milestone-based payment system.
 */
contract FreelanceEscrow is ReentrancyGuard, Ownable {
    
    enum MilestoneStatus { Pending, Funded, Submitted, Approved, Disputed, Resolved }

    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
    }

    struct Project {
        address client;
        address freelancer;
        uint256 totalAmount;
        uint256 milestoneCount;
        bool isFunded;
        mapping(uint256 => Milestone) milestones;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;

    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 totalAmount);
    event ProjectFunded(uint256 indexed projectId, uint256 amount);
    event MilestoneSubmitted(uint256 indexed projectId, uint256 indexed milestoneId);
    event MilestoneApproved(uint256 indexed projectId, uint256 indexed milestoneId, uint256 amount);
    event DisputeRaised(uint256 indexed projectId, uint256 indexed milestoneId);
    event DisputeResolved(uint256 indexed projectId, uint256 indexed milestoneId, bool releasedToFreelancer);
    event FundsRescued(address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    receive() external payable {}
    fallback() external payable {}

    function createProject(
        address _freelancer,
        string[] calldata _descriptions,
        uint256[] calldata _amounts
    ) public returns (uint256) {
        // Allowing _freelancer to be address(0) for open projects
        if (_descriptions.length != _amounts.length) revert MismatchingData();
        if (_descriptions.length == 0) revert NoMilestones();

        uint256 id = ++projectCount;
        Project storage project = projects[id];
        project.client = msg.sender;
        project.freelancer = _freelancer;
        project.milestoneCount = _descriptions.length;

        uint256 total = 0;
        for (uint256 i = 0; i < _descriptions.length; i++) {
            project.milestones[i] = Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                status: MilestoneStatus.Pending
            });
            total += _amounts[i];
        }
        project.totalAmount = total;

        emit ProjectCreated(id, msg.sender, _freelancer, total);
        return id;
    }

    function createAndFundProject(
        address _freelancer,
        string[] calldata _descriptions,
        uint256[] calldata _amounts
    ) external payable nonReentrant returns (uint256) {
        uint256 id = createProject(_freelancer, _descriptions, _amounts);
        Project storage project = projects[id];
        
        if (msg.value != project.totalAmount) revert IncorrectFunding();

        project.isFunded = true;
        for (uint256 i = 0; i < project.milestoneCount; i++) {
            project.milestones[i].status = MilestoneStatus.Funded;
        }

        emit ProjectFunded(id, msg.value);
        return id;
    }

    function fundProject(uint256 _projectId) external payable nonReentrant {
         Project storage project = projects[_projectId];
        if (msg.sender != project.client) revert OnlyClient();
        if (project.isFunded) revert AlreadyFunded();
        if (msg.value != project.totalAmount) revert IncorrectFunding();

        project.isFunded = true;
        for (uint256 i = 0; i < project.milestoneCount; i++) {
            project.milestones[i].status = MilestoneStatus.Funded;
        }

        emit ProjectFunded(_projectId, msg.value);
    }

    function assignFreelancer(uint256 _projectId, address _freelancer) external {
        Project storage project = projects[_projectId];
        if (msg.sender != project.client) revert OnlyClient();
        if (_freelancer == address(0)) revert InvalidAddress();
        
        project.freelancer = _freelancer;
    }

    function submitMilestone(uint256 _projectId, uint256 _milestoneId) external {
        Project storage project = projects[_projectId];
        if (msg.sender != project.freelancer) revert OnlyFreelancer();
        if (project.milestones[_milestoneId].status != MilestoneStatus.Funded) revert MilestoneNotFunded();

        project.milestones[_milestoneId].status = MilestoneStatus.Submitted;
        emit MilestoneSubmitted(_projectId, _milestoneId);
    }

    /**
     * @dev Approves a milestone and releases funds to the freelancer.
     */
    function releasePayment(uint256 _projectId, uint256 _milestoneId) public nonReentrant {
        Project storage project = projects[_projectId];
        if (msg.sender != project.client) revert OnlyClient();
        
        Milestone storage milestone = project.milestones[_milestoneId];
        if (milestone.status != MilestoneStatus.Submitted && milestone.status != MilestoneStatus.Funded) revert MilestoneNotSubmitted();

        uint256 amount = milestone.amount;
        milestone.status = MilestoneStatus.Approved;

        (bool success, ) = payable(project.freelancer).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit MilestoneApproved(_projectId, _milestoneId, amount);
    }

    /**
     * @dev Approves all pending/submitted milestones and releases all remaining funds.
     */
    function releaseAllPayments(uint256 _projectId) external nonReentrant {
        Project storage project = projects[_projectId];
        if (msg.sender != project.client) revert OnlyClient();

        uint256 totalToRelease = 0;
        for (uint256 i = 0; i < project.milestoneCount; i++) {
            Milestone storage milestone = project.milestones[i];
            if (milestone.status == MilestoneStatus.Funded || milestone.status == MilestoneStatus.Submitted) {
                totalToRelease += milestone.amount;
                milestone.status = MilestoneStatus.Approved;
                emit MilestoneApproved(_projectId, i, milestone.amount);
            }
        }

        if (totalToRelease > 0) {
            (bool success, ) = payable(project.freelancer).call{value: totalToRelease}("");
            if (!success) revert TransferFailed();
        }
    }

    function disputeMilestone(uint256 _projectId, uint256 _milestoneId) external {
        Project storage project = projects[_projectId];
        if (msg.sender != project.client && msg.sender != project.freelancer) revert OnlyInvolvedParties();
        
        Milestone storage milestone = project.milestones[_milestoneId];
        if (milestone.status != MilestoneStatus.Submitted) revert CannotDispute();

        milestone.status = MilestoneStatus.Disputed;
        emit DisputeRaised(_projectId, _milestoneId);
    }

    function resolveDispute(uint256 _projectId, uint256 _milestoneId, bool _releaseToFreelancer) external onlyOwner nonReentrant {
        Project storage project = projects[_projectId];
        Milestone storage milestone = project.milestones[_milestoneId];
        if (milestone.status != MilestoneStatus.Disputed) revert NotInDispute();

        milestone.status = MilestoneStatus.Resolved;

        address target = _releaseToFreelancer ? project.freelancer : project.client;
        (bool success, ) = payable(target).call{value: milestone.amount}("");
        if (!success) revert TransferFailed();

        emit DisputeResolved(_projectId, _milestoneId, _releaseToFreelancer);
    }

    function getProjectDetails(uint256 _projectId) external view returns (
        address client,
        address freelancer,
        uint256 totalAmount,
        uint256 milestoneCount,
        bool isFunded
    ) {
        Project storage p = projects[_projectId];
        return (p.client, p.freelancer, p.totalAmount, p.milestoneCount, p.isFunded);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
        emit FundsRescued(owner(), balance);
    }
}
