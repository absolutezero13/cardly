import api from "../api";

export type BackendUser = {
  _id: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
};

class UserService {
  async saveUser(uid: string): Promise<BackendUser> {
    const response = await api.post<BackendUser>("/users", { uid });
    return response.data;
  }
}

const userService = new UserService();

export default userService;