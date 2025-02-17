import { useQuery } from "@tanstack/react-query";
import { getUsers, type User } from "../actions/users";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
}
