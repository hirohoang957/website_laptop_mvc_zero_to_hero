import { z } from "zod";

export const AdminProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, { message: "Tên sản phẩm không được để trống." }),
    shortDesc: z.string().trim().min(1, { message: "Mô tả ngắn không được để trống." }),
    detailDesc: z.string().trim().min(1, { message: "Mô tả chi tiết không được để trống." }),
    cpu: z.string().trim().min(1, { message: "Vi xử lý (CPU) không được để trống." }),
    cpuType: z.string().trim().min(1, { message: "Vui lòng chọn dòng CPU." }),
    ram: z.string().trim().min(1, { message: "Vui lòng chọn dung lượng RAM." }),
    ramType: z.string().trim().min(1, { message: "Vui lòng chọn chuẩn RAM." }),
    storage: z.string().trim().min(1, { message: "Vui lòng chọn dung lượng ổ cứng." }),
    storageType: z.string().trim().min(1, { message: "Vui lòng chọn loại ổ cứng." }),
    gpu: z.string().trim().min(1, { message: "Card đồ họa (GPU) không được để trống." }),
    gpuType: z.string().trim().min(1, { message: "Vui lòng chọn loại card đồ họa." }),
    screenSize: z.string().trim().min(1, { message: "Kích thước màn hình không được để trống." }),
    resolution: z.string().trim().min(1, { message: "Vui lòng chọn độ phân giải màn hình." }),
    os: z.string().trim().min(1, { message: "Vui lòng chọn hệ điều hành." }),
    battery: z.string().trim().min(1, { message: "Dung lượng pin không được để trống." }),
    weight: z.string().trim().min(1, { message: "Trọng lượng máy không được để trống." }),
    priceOrigin: z
        .string()
        .transform((val) => (val === "" ? 0 : Number(val)))
        .refine((num) => !isNaN(num) && num > 0, {
            message: "Giá gốc không được để trống và phải lớn hơn 0 VNĐ.",
        }),
    priceCurr: z
        .string()
        .transform((val) => (val === "" ? 0 : Number(val)))
        .refine((num) => !isNaN(num) && num > 0, {
            message: "Giá bán hiện tại phải lớn hơn 0 VNĐ.",
        })
        .optional(),
    quantity: z
        .string()
        .transform((val) => (val === "" ? -1 : Number(val)))
        .refine((num) => !isNaN(num) && num >= 0, {
            message: "Số lượng kho không được để trống và phải lớn hơn hoặc bằng 0.",
        }),
    sold: z.string().optional(),
    status: z.enum(["0", "1"], { message: "Trạng thái sản phẩm không hợp lệ." }).optional(),
    hot: z.enum(["0", "1"], { message: "Trạng thái nổi bật không hợp lệ." }).optional(),
    brandId: z.string().trim().min(1, { message: "Vui lòng chọn thương hiệu." }),
    categoryId: z.string().trim().min(1, { message: "Vui lòng chọn danh mục sản phẩm." }),
});

export type TAdminProductSchema = z.infer<typeof AdminProductSchema>;