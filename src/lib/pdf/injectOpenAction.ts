import { PDFDocument, PDFName, PDFArray, PDFNumber, PDFDict } from 'pdf-lib'

// PDF를 열 때 항상 1페이지 상단에서 시작하도록 /OpenAction 주입
export async function injectOpenAction(buffer: Buffer): Promise<Buffer> {
  const doc = await PDFDocument.load(buffer)
  const pages = doc.getPages()
  if (pages.length === 0) return buffer

  const firstPage = pages[0]
  const { height } = firstPage.getSize()

  // /OpenAction: [firstPageRef /XYZ left top zoom]
  // /XYZ 0 height 0 → 1페이지 좌상단, 줌 현재 유지(0)
  const openAction = PDFArray.withContext(doc.context)
  openAction.push(firstPage.ref)
  openAction.push(PDFName.of('XYZ'))
  openAction.push(PDFNumber.of(0))
  openAction.push(PDFNumber.of(height))
  openAction.push(PDFNumber.of(0))

  doc.catalog.set(PDFName.of('OpenAction'), openAction)

  const out = await doc.save()
  return Buffer.from(out)
}
