// server/api/upload-s3.post.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // 1. Validasi Multipart Form (File Upload)
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, message: 'No file uploaded' })
    }

    const file = files[0] // Ambil file pertama
    const fileExt = file.filename?.split('.').pop() || 'jpg'
    const fileName = `attendance/${uuidv4()}.${fileExt}` // Path di S3: attendance/random-id.jpg

    // 2. Init S3 Client
    const s3Client = new S3Client({
        region: config.awsRegion,
        credentials: {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey,
        },
    })

    // 3. Upload ke S3
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: config.awsBucket,
            Key: fileName,
            Body: file.data,
            ContentType: file.type || 'image/jpeg',
            ACL: 'public-read', // Agar bisa diakses via URL publik
        }))

        // 4. Return URL Public S3
        // Format URL S3 standar: https://{bucket}.s3.{region}.amazonaws.com/{key}
        const publicUrl = `https://${config.awsBucket}.s3.${config.awsRegion}.amazonaws.com/${fileName}`

        return { url: publicUrl }
    } catch (error) {
        console.error('S3 Upload Error:', error)
        throw createError({ statusCode: 500, message: 'Failed to upload to S3' })
    }
})