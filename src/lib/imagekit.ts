import ImageKit from "imagekit";

export function imageKitConfigured() {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT,
  );
}

function client() {
  if (!imageKitConfigured()) {
    throw new Error("ImageKit is not configured");
  }
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
  });
}

export async function uploadToImageKit(input: {
  buffer: Buffer;
  fileName: string;
  folder: string;
  mime: string;
}) {
  const ik = client();
  const result = await ik.upload({
    file: input.buffer,
    fileName: input.fileName,
    folder: input.folder,
    useUniqueFileName: true,
    isPrivateFile: false,
    tags: ["icash", input.mime.replace("/", "-")],
  });
  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
  };
}

export async function deleteFromImageKit(fileId: string) {
  if (!imageKitConfigured() || !fileId) return;
  try {
    await client().deleteFile(fileId);
  } catch {
    /* ignore missing remote file */
  }
}
