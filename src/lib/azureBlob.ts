import { BlobServiceClient } from '@azure/storage-blob'

const CONTAINER = 'company-stamps'

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING 환경변수가 설정되지 않았습니다.')
  }
  const serviceClient = BlobServiceClient.fromConnectionString(connectionString)
  return serviceClient.getContainerClient(CONTAINER)
}

export async function uploadStampToBlob(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const containerClient = getContainerClient()
  const blockBlobClient = containerClient.getBlockBlobClient(filename)
  await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } })
  return blockBlobClient.url
}
