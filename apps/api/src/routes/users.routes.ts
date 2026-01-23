import { UserModel } from '../entities/user/user.model';
import { createBaseCRUD } from '../shared/base';
import { hashPassword } from '../shared/password';

const userRouter = createBaseCRUD(UserModel, {
  preCreate: async (data) => {
    if (data.password) data.password = await hashPassword(data.password);
    return data;
  },
  preUpdate: async (data) => {
    if (data.password) data.password = await hashPassword(data.password);
    return data;
  },
});

export default userRouter;
