import { isEmailExist } from "services/user/auth.service";
import { z } from "zod";

const emailSchema = z
    .string()
    .trim()
    .min(1, { message: "Email không được để trống." })
    .email({ message: "Email không đúng định dạng." })
    .refine(
        async (email) => {
            const existingUser = await isEmailExist(email);
            return !existingUser;
        },
        {
            message: "Email này đã tồn tại trong hệ thống.",
            path: ["email"],
        }
    );

const passwordSchema = z
    .string()
    .trim()
    .min(5, { message: "Mật khẩu phải có tối thiểu 5 ký tự." })
    .max(15, { message: "Mật khẩu chỉ được tối đa 15 ký tự." });

const phoneSchema = z
    .string()
    .trim()
    .regex(/^$|^[0-9]{10}$/, { message: "Số điện thoại phải bao gồm đúng 10 chữ số." })
    .optional();

export const AdminUserSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().trim().min(1, { message: "Vui lòng xác nhận mật khẩu." }),
        phone: phoneSchema,
        fullName: z.string().trim().min(1, { message: "Họ và tên không được để trống." }),
        address: z.string().trim().optional(),
        status: z.enum(["0", "1"], { message: "Trạng thái tài khoản không hợp lệ." }).optional(),
        roleId: z.string().trim().min(1, { message: "Vui lòng chọn vai trò hệ thống." }).optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không trùng khớp.",
        path: ["confirmPassword"],
    });

export const AdminUpdateUserSchema = z.object({
    id: z.string().optional(),
    fullName: z.string().trim().min(1, { message: "Họ và tên không được để trống." }).optional(),
    address: z.string().trim().optional(),
    status: z.enum(["0", "1"], { message: "Trạng thái tài khoản không hợp lệ." }).optional(),
    roleId: z.string().trim().optional(),
    phone: phoneSchema,
    email: z.string().trim().optional(),
});

export type TAdminUserSchema = z.infer<typeof AdminUserSchema>;
export type TAdminUpdateUserSchema = z.infer<typeof AdminUpdateUserSchema>;