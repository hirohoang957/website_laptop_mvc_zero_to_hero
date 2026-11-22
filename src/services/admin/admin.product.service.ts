import { prisma } from "config/client";

const getAllProducts = async () => {
    const products = await prisma.product.findMany({
        orderBy: {
            id: 'asc', 
        },
    });
    return products;
}

const getProducts = async (limit: number = 8) => {
    const products = await prisma.product.findMany({
        where: {
            AND: {
                quantity: { gt: 0 },
                status: { gt: 0}
            }
        },
    })
    return products
}


const handleCreateProduct = async (
    name: string, shortDesc: string, detailDesc: string, thumbnail: string, images: string[],
    cpu: string, cpuType: string, ram: string, ramType: string, storage: string,
    storageType: string, gpu: string, gpuType: string, screenSize: string,
    resolution: string, os: string, battery: string, weight: string, priceOrigin: string,
    quantity: string, status: string, brandId: string, categoryId: string
) => {
    const product = await prisma.product.create({
        data: {
            name: name,
            shortDesc: shortDesc,
            detailDesc: detailDesc,
            thumbnail: thumbnail,
            cpu: cpu,
            cpuType: cpuType,
            ram: +ram,
            ramType: ramType,
            storage: +storage,
            storageType: storageType,
            gpu: gpu,
            gpuType: gpuType,
            screenSize: screenSize,
            resolution: resolution,
            os: os,
            battery: battery,
            weight: weight,
            priceOrigin: +priceOrigin,
            priceCurr: +priceOrigin,
            quantity: +quantity,
            status: +status,
            brandId: +brandId,
            categoryId: +categoryId,
            // Khớp chính xác với model Image { filename String? }
            ...(images.length > 0 && {
                image: {
                    create: images.map((img) => ({ filename: img })),
                },
            }),
        },
    });
    return product;
};

const handleDeleteProduct = async (id: string) => {
    const deleteProduct = await prisma.product.delete({
        where: {id: +id}
    })
    return deleteProduct
}

const getProductById = async (id : string) => {
    const product = await prisma.product.findUnique({
        where : {id: +id},
        include: {image: true}
    });
    return product;
}

const handleUpdateProduct = async (
    id: string,
    name: string, shortDesc: string, detailDesc: string,
    thumbnail: string, newImages: string[], deletedIds: string[],
    cpu: string, cpuType: string, ram: string, ramType: string, storage: string,
    storageType: string, gpu: string, gpuType: string, screenSize: string,
    resolution: string, os: string, battery: string, weight: string,
    priceOrigin: string, priceCurr: string, quantity: string, status: string,
    brandId: string, categoryId: string
) => {
    // (Tùy chọn) Xóa file ảnh cũ trong thư mục public/images/product trước khi xóa khỏi DB
    if (deletedIds.length > 0) {
        const imagesToDelete = await prisma.image.findMany({
            where: { id: { in: deletedIds.map((imgId) => +imgId) } },
        });
    }

    const product = await prisma.product.update({
        where: { id: +id },
        data: {
            name: name,
            shortDesc: shortDesc,
            detailDesc: detailDesc,
            cpu: cpu,
            cpuType: cpuType,
            ram: +ram,
            ramType: ramType,
            storage: +storage,
            storageType: storageType,
            gpu: gpu,
            gpuType: gpuType,
            screenSize: screenSize,
            resolution: resolution,
            os: os,
            battery: battery,
            weight: weight,
            priceOrigin: +priceOrigin,
            priceCurr: +priceCurr,
            quantity: +quantity,
            status: +status,
            brandId: +brandId,
            categoryId: +categoryId,
            ...(thumbnail && { thumbnail: thumbnail }),
            // Cập nhật bảng Image (quan hệ `image` trong schema.prisma)
            ...((deletedIds.length > 0 || newImages.length > 0) && {
                image: {
                    ...(deletedIds.length > 0 && {
                        deleteMany: {
                            id: { in: deletedIds.map((imgId) => +imgId) },
                        },
                    }),
                    ...(newImages.length > 0 && {
                        create: newImages.map((filename) => ({ filename })),
                    }),
                },
            }),
        },
    });
    return product;
};

export {
    getAllProducts,
    handleCreateProduct,
    handleDeleteProduct,
    getProductById,
    handleUpdateProduct,
    getProducts,
}