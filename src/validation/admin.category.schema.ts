import { isCategoryExist } from "services/admin/admin.service";
import { z } from "zod";

export const AdminCategorySchema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, { message: "Tên không được để trống." }).refine(
        async (name) => {
            const existingCategory = await isCategoryExist(name);
            return !existingCategory;
        }, {
        message: "Category already exists",
        path: ["category"],
    }
    )
})

export type TAdminCategorySchema = z.infer<typeof AdminCategorySchema>;