import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // 1. Validasi Multipart Form (File Upload)
    const files = await readMultipartFormData(event)
    if (!files || files.length === 0) {
        throw createError({ statusCode: 400, message: 'No file uploaded' })
    }

    const file = files.find(f => f.name === 'file')
    const kodeUserField = files.find(f => f.name === 'kode_user')

    if (!file) {
        throw createError({ statusCode: 400, message: 'File is missing' })
    }

    if (!kodeUserField || !kodeUserField.data) {
        throw createError({ statusCode: 400, message: 'kode_user is missing' })
    }

    const kode_user = kodeUserField.data.toString()
    const fileName = `freelance_profile/${kode_user}.jpg`

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
            // Gunakan inline cache control optional
            CacheControl: 'max-age=0'
        }))

        // 4. Return URL Public S3
        const publicUrl = `https://${config.awsBucket}.s3.${config.awsRegion}.amazonaws.com/${fileName}`

        return { url: publicUrl, success: true }
    } catch (error: any) {
        console.error('S3 Upload Error Full:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            requestId: error.$metadata?.requestId,
            extendedRequestId: error.$metadata?.extendedRequestId
        })
        throw createError({
            statusCode: 500,
            message: `Failed to upload to S3: ${error.message} (${error.name})`
        })
    }
})
