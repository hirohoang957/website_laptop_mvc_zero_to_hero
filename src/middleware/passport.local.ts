import { prisma } from "config/client";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { comparePassword, getUserSumCart, getUserWithRoleById } from "services/user/auth.service";

const configPassportLocal = () => {
    passport.use(new LocalStrategy({
        usernameField: "email",
        passReqToCallback: true
    }, async function verify(req, username, password, callback) {
        // reset messages error
        const { session } = req as any;
        if (session?.messages?.length) {
            session.messages = []
        }

        // Kiểm tra email này đã tồn tại chưa
        const user = await prisma.user.findUnique(
            { where: { username: username } }
        );
        if (!user) {
            // throw new Error(`Username: ${username} not found!!`);
            return callback(null, false, { message: "Email hoặc mật khẩu không chính xác!" });
        }
        // So sánh mật khẩu
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            // throw new Error(`Invalid password!!`);
            return callback(null, false, { message: "Email hoặc mật khẩu không chính xác!" });
        }

        // Kiểm tra tài khoản có bị khóa hay không
        if(user.status === 0) return callback(null, false, { message: "Tài khoản của bạn đã bị khóa!" });

        return callback(null, user as any);
    }));

    passport.serializeUser(function (user: any, callback) {
        callback(null, { id: user.id, username: user.username});
    });

    // ho tro ghi thong tin nguoi dung vao req
    passport.deserializeUser(async function (user: any, callback) {
        const { id, username } = user;
        //query to database
        const userInDB: any = await getUserWithRoleById(id);
        const sumCart = await getUserSumCart(id);
        // console.log(userInDB);
        // console.log("sumCart: " + sumCart);
        return callback(null, {...userInDB, sumCart: sumCart});

    });
}

export { configPassportLocal }