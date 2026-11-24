import { Request, Response } from "express";
import { getProductById, handleCreateProduct, handleDeleteProduct, handleUpdateProduct } from "services/admin/admin.product.service";
import { getAllBrands, getAllCategories } from "services/admin/admin.service";
import { AdminProductSchema } from "src/validation/admin.product.schema";

// Truy cập trang tạo sản phẩm
const getAdminCreateProductPage = async (req: Request, res: Response) => {
    const errors: Array<string> = [];
    const oldData = {
        name: "", shortDesc: "", detailDesc: "", cpu: "",
        cpuType: "", ram: "", ramType: "", storage: "",
        storageType: "", gpu: "", gpuType: "", screenSize: "", 
        resolution: "", os: "", battery: "", weight: "",
        priceOrigin: "", quantity: "", status: "",
        brandId: "", categoryId: "", hot: ""
    }
    const categories = await getAllCategories();
    const brands = await getAllBrands();

    return res.render("admin/product/create.ejs", {
        categories: categories,
        brands: brands,
        errors: errors,
        oldData: oldData
    });
}

// Xử lý tạo sản phẩm
const postAdminCreateProduct = async (req: Request, res: Response) => {
    const {
        name, shortDesc, detailDesc, cpu, cpuType, ram, ramType,
        storage, storageType, gpu, gpuType, screenSize, resolution,
        os, battery, weight, priceOrigin, quantity, status, brandId, categoryId, hot
    } = req.body;

    const categories = await getAllCategories();
    const brands = await getAllBrands();

    // Ép kiểu req.files từ multer .fields([{ name: "thumbnail" }, { name: "images" }])
    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    } | undefined;

    // 1. Lấy tên file thumbnail
    const thumbnail = files?.["thumbnail"]?.[0]?.filename ?? "";

    // 2. Lấy danh sách tên các file ảnh con
    const images: string[] = files?.["images"]?.map((file) => file.filename) ?? [];

    const validate = await AdminProductSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);
        const oldData = {
            name, shortDesc, detailDesc, cpu, cpuType, ram, ramType,
            storage, storageType, gpu, gpuType, screenSize, resolution,
            os, battery, weight, priceOrigin, quantity, status, brandId, categoryId, hot
        };

        return res.render("admin/product/create.ejs", {
            categories: categories,
            brands: brands,
            oldData: oldData,
            errors: errors
        });
    }

    await handleCreateProduct(
        name, shortDesc, detailDesc, thumbnail, images,
        cpu, cpuType, ram, ramType, storage,
        storageType, gpu, gpuType, screenSize,
        resolution, os, battery, weight, priceOrigin,
        quantity, status, brandId, categoryId, hot
    );
    return res.redirect("/admin/product");
};

// Xử lý xóa sản phẩm
const postAdminDeleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    await handleDeleteProduct(id as string);
    return res.redirect("/admin/product");
}

// Truy cập trang chi tiết sản phẩm phía ADMIN
const getAdminViewProductPage = async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await getProductById(id as string);
    console.log(product);
    const errors: Array<string> = [];
    const categories = await getAllCategories();
    const brands = await getAllBrands();
    return res.render("admin/product/detail.ejs", {
        categories: categories,
        brands: brands,
        errors: errors,
        product: product
    })
}

const postAdminUpdateProduct = async (req: Request, res: Response) => {
    const {
        id, name, brandId, categoryId, shortDesc, detailDesc, priceOrigin, priceCurr, quantity, status,
        cpu, cpuType, ram, ramType, storage, storageType, hot,
        gpu, gpuType, screenSize, resolution, os, battery, weight,
        deletedImageIds
    } = req.body;

    const categories = await getAllCategories();
    const brands = await getAllBrands();

    // Ép kiểu req.files từ multer .fields([{ name: "thumbnail" }, { name: "images" }])
    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    } | undefined;

    // 1. Lấy tên file thumbnail mới (nếu có)
    const thumbnail = files?.["thumbnail"]?.[0]?.filename ?? "";

    // 2. Lấy danh sách tên các file ảnh con mới upload (nếu có)
    const newImages: string[] = files?.["images"]?.map((file) => file.filename) ?? [];

    // 3. Chuẩn hóa danh sách ID ảnh cũ cần xóa thành mảng string[]
    const deletedIds: string[] = Array.isArray(deletedImageIds)
        ? deletedImageIds
        : deletedImageIds
            ? [deletedImageIds]
            : [];

    const validate = await AdminProductSchema.safeParseAsync(req.body);
    if (!validate.success) {
        const errorsZod = validate.error.issues;
        const errors = errorsZod?.map(item => `${item.message} (${item.path[0]})`);

        // Lấy lại ảnh cũ từ DB để nếu validate lỗi thì giao diện không bị mất ảnh
        const existingProduct = await getProductById(id as string);

        const product = {
            id, name, brandId, categoryId, shortDesc, detailDesc, priceOrigin, priceCurr, quantity, status,
            cpu, cpuType, ram, ramType, storage, storageType, hot,
            gpu, gpuType, screenSize, resolution, os, battery, weight,
            thumbnail: existingProduct?.thumbnail ?? "",
            image: existingProduct?.image ?? []
        };

        return res.render("admin/product/detail.ejs", {
            categories: categories,
            brands: brands,
            product: product,
            errors: errors
        });
    }

    await handleUpdateProduct(
        id, name, shortDesc, detailDesc, thumbnail, newImages, deletedIds,
        cpu, cpuType, ram, ramType, storage,
        storageType, gpu, gpuType, screenSize,
        resolution, os, battery, weight, priceOrigin, priceCurr,
        quantity, status, brandId, categoryId, hot
    );
    return res.redirect("/admin/product");
};

export {
    getAdminCreateProductPage,
    postAdminCreateProduct,
    postAdminDeleteProduct,
    getAdminViewProductPage,
    postAdminUpdateProduct
}