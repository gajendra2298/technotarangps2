export const abi = [
  {
    "inputs": [
      { "internalType": "address", "name": "_freelancer", "type": "address" },
      { "internalType": "string[]", "name": "_descriptions", "type": "string[]" },
      { "internalType": "uint256[]", "name": "_amounts", "type": "uint256[]" }
    ],
    "name": "createProject",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_projectId", "type": "uint256" }],
    "name": "fundProject",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_projectId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }
    ],
    "name": "submitMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_projectId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }
    ],
    "name": "approveMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_projectId", "type": "uint256" },
      { "internalType": "uint256", "name": "_milestoneId", "type": "uint256" }
    ],
    "name": "getMilestone",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
