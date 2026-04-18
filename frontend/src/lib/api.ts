import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/authSlice";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Request interceptor for adding JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling 401s and global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    if (error.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
      store.dispatch(logout());
      window.location.href = "/";
    } else {
      // Global error toasting (except for 401 which is handled above)
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export const userApi = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.patch("/user/update-profile", data),
};

export const projectsApi = {
  findAll: () => api.get("/projects"),
  getClientProjects: () => api.get("/projects/client"),
  getFreelancerProjects: () => api.get("/projects/freelancer"),
  findOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  createAndFund: (txHash: string, project: any) => 
    api.post("/projects/create-and-fund", { txHash, project }),
  fund: (id: string, amount: string, transactionHash?: string) =>
    api.post(`/projects/${id}/fund`, { amount, transactionHash }),
  submitMilestone: (id: string, milestoneIndex: number, proof: string) =>
    api.post(`/projects/${id}/milestones/${milestoneIndex}/submit`, { proof }),
  approveMilestone: (
    id: string,
    milestoneIndex: number,
    transactionHash: string,
  ) =>
    api.post(`/projects/${id}/milestones/${milestoneIndex}/release`, {
      transactionHash,
    }),
  addUpdate: (id: string, data: { description: string; files: string[] }) =>
    api.post(`/projects/${id}/update`, data),
  getUpdates: (id: string) => api.get(`/projects/${id}/updates`),
  submitFinalWork: (id: string, data: any) =>
    api.post(`/projects/${id}/submit`, data),
  approveSubmission: (id: string, transactionHash: string) =>
    api.post(`/projects/${id}/approve-submission`, { transactionHash }),
};

export const bidsApi = {
  create: (data: {
    projectId: string;
    proposedAmount: number;
    message: string;
  }) => api.post("/bids", data),
  getForProject: (projectId: string) => api.get(`/bids/project/${projectId}`),
  accept: (bidId: string) => api.patch(`/bids/${bidId}/accept`),
  reject: (bidId: string) => api.patch(`/bids/${bidId}/reject`),
};

export const authApi = {
  sync: (data: { token: string; email: string; clerkId: string }) =>
    api.post("/auth/sync", data),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post("/auth/verify-otp", { email, otp }),
};

export default api;
