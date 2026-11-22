import { isBrandExist } from "services/admin/admin.service";
import { z } from "zod";

export const AdminBrandSchema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, { message: "Tên không được để trống." }).refine(
        async (name) => {
            const existingBrand = await isBrandExist(name);
            return !existingBrand;
        }, {
        message: "Brand already exists",
        path: ["brand"],
    }
    )
})

export type TAdminBrandSchema = z.infer<typeof AdminBrandSchema>;