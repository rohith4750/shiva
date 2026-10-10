import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { User } from "@/types/user";

interface ApiResponse<T> {
  success: boolean;
  users?: T[];
  user?: T;
  error?: string;
  message?: string;
}

/**
 * Fetch all users with TanStack Query caching
 */
export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async (): Promise<User[]> => {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error(`Failed to load users: ${res.statusText}`);
      }
      const data: ApiResponse<User> = await res.json();
      if (!data.success || !Array.isArray(data.users)) {
        throw new Error(data.error || "Could not retrieve user list");
      }
      return data.users;
    },
  });
}

/**
 * Create a new user mutation with query invalidation
 */
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<User> & { password?: string }): Promise<User> => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiResponse<User> = await res.json();
      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.error || "Failed to create user");
      }
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Update user mutation with optimistic cache update
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<User> }): Promise<User> => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData: ApiResponse<User> = await res.json();
      if (!res.ok || !resData.success || !resData.user) {
        throw new Error(resData.error || "Failed to update user");
      }
      return resData.user;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });

      // Snapshot previous users list
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      // Optimistically update cache
      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          queryKeys.users.lists(),
          previousUsers.map((u) => (String(u.id) === String(id) ? { ...u, ...data } : u))
        );
      }

      return { previousUsers };
    },
    onError: (_err, _vars, context) => {
      // Rollback to previous state on failure
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
      }
    },
    onSettled: () => {
      // Always re-validate after mutation finishes
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Delete user mutation with optimistic cache removal
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number): Promise<void> => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      const data: ApiResponse<User> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user");
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      if (previousUsers) {
        queryClient.setQueryData<User[]>(
          queryKeys.users.lists(),
          previousUsers.filter((u) => String(u.id) !== String(id))
        );
      }

      return { previousUsers };
    },
    onError: (_err, _id, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Reset and seed demo database
 */
export function useResetSeedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const res = await fetch("/api/seed", { method: "POST" });
      const data: ApiResponse<unknown> = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset demo database");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
