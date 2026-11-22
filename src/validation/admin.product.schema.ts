import { z } from "zod";

export const AdminProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, { message: "Tên không được để trống." }),
    shortDesc: z.string().trim().min(1, { message: "Mô tả ngắn không được để trống." }),
    detailDesc: z.string().trim().min(1, { message: "Mô tả dài không được để trống." }),
    cpu: z.string().trim().min(1, { message: "CPU không được để trống." }),
    cpuType: z.string().trim().min(1, { message: "Loại CPU chưa được chọn." }),
    ram: z.string().trim().min(1, { message: "Ram chưa được chọn." }),
    ramType: z.string().trim().min(1, { message: "Loại Ram chưa được chọn." }),
    storage: z.string().trim().min(1, { message: "Dung lượng ổ cứng chưa được chọn." }),
    storageType: z.string().trim().min(1, { message: "Loại ổ cứng chưa được chọn." }),
    gpu: z.string().trim().min(1, { message: "GPU không được để trống." }),
    gpuType: z.string().trim().min(1, { message: "Loại GPU chưa được chọn." }),
    screenSize: z.string().trim().min(1, { message: "Kích thước màn hình không được để trống." }),
    resolution: z.string().trim().min(1, { message: "Độ phân giải chưa được chọn." }),
    os: z.string().trim().min(1, { message: "Hệ điều hành chưa được chọn." }),
    battery: z.string().trim().min(1, { message: "Pin không được để trống." }),
    weight: z.string().trim().min(1, { message: "Cân nặng không được để trống." }),
    priceOrigin: z.string().transform((val) => (val === "" ? 0 : Number(val)))
                .refine((num) => num > 0, {message : "Giá gốc phải lớn hơn 1 và không được để trống"}),
    priceCurr: z.string().transform((val) => (val === "" ? 0 : Number(val)))
                .refine((num) => num > 0, {message : "Giá hiện tại phải lớn hơn 1 và không được để trống"}).optional(),
    quantity: z.string().transform((val) => (val === "" ? 0 : Number(val)))
                .refine((num) => num > 0, {message : "Giá phải lớn hơn 1 và không được để trống"}),
    sold: z.string().optional(),
    status: z.string().optional(),
    brandId: z.string().trim().min(1, { message: "Thương hiệu chưa được chọn." }),
    categoryId: z.string().trim().min(1, { message: "Danh mục chưa được chọn." }),
})

export type TAdminProductSchema = z.infer<typeof AdminProductSchema>;