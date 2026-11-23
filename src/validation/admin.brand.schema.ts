import { isBrandExist } from "services/admin/admin.service";
import { z } from "zod";

export const AdminBrandSchema = z.object({
    id: z.string().optional(),
    name: z
        .string()
        .trim()
        .min(1, { message: "Tên thương hiệu không được để trống." })
        .refine(
            async (name) => {
                const existingBrand = await isBrandExist(name);
                return !existingBrand;
            },
            {
                message: "Thương hiệu này đã tồn tại trong hệ thống.",
                path: ["name"],
            }
        ),
});

export type TAdminBrandSchema = z.infer<typeof AdminBrandSchema>;