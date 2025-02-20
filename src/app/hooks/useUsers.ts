import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { getUsers } from "../actions/users";
import { type User } from "~/app/types/user";

export function useUsers(): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const users = await getUsers();
      return users.map((user) => ({
        ...user,
        activities: user.activities?.map((activity) => ({
          ...activity,
          isLoggedIn: true, // Since these are from the server, they are logged in users
        })) ?? [],
      }));
    },
  });
}
