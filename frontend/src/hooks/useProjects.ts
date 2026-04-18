import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../lib/api";

export function useAllProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ["projects", "all"],
    queryFn: async () => {
      const res = await projectsApi.findAll();
      return res.data;
    },
    enabled,
  });
}

export function useClientProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ["projects", "client"],
    queryFn: async () => {
      const res = await projectsApi.getClientProjects();
      return res.data;
    },
    enabled,
  });
}

export function useFreelancerProjects(enabled: boolean = true) {
  return useQuery({
    queryKey: ["projects", "freelancer"],
    queryFn: async () => {
      const res = await projectsApi.getFreelancerProjects();
      return res.data;
    },
    enabled,
  });
}
