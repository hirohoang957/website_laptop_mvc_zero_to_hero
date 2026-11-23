import { isCategoryExist } from "services/admin/admin.service";
import { z } from "zod";

export const AdminCategorySchema = z.object({
    id: z.string().optional(),
    name: z
        .string()
        .trim()
        .min(1, { message: "Tên danh mục không được để trống." })
        .refine(
            async (name) => {
                const existingCategory = await isCategoryExist(name);
                return !existingCategory;
            },
            {
                message: "Danh mục này đã tồn tại trong hệ thống.",
                path: ["name"],
            }
        ),
});

export type TAdminCategorySchema = z.infer<typeof AdminCategorySchema>;