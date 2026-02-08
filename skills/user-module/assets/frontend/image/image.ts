// 图像相关能力统一封装
// @ts-ignore
import { imaging, action, app, core } from "photoshop";
// @ts-ignore
import { storage } from 'uxp';
import { apiFetch } from '../api/client';

/**
 * 获取当前活动图层信息
 */
export function getCurrentLayerInfo() {
  const doc = app.activeDocument;
  if (!doc || !doc.activeLayers || doc.activeLayers.length === 0) {
    throw new Error('当前没有选中任何图层');
  }
  const layer = doc.activeLayers[0];
  return { name: layer.name, kind: layer.kind, id: layer.id };
}

/**
 * 导出指定图层为 PNG
 */



export async function saveLayerToTos(layerId: number) {
    const imageObj = await imaging.getPixels({
      layerID: layerId,
      applyAlpha: true 
    });


    // 这里有尺寸的逻辑
    // console.log(imageObj.sourceBounds)
    // console.log(imageObj.sourceBounds.left)
    const jpegBase64 = await imaging.encodeImageData({
        "imageData": imageObj.imageData,
        "base64": true
    });

    // # AI_Amend 2026-01-29 上传到 TOS 而不是本地保存
    // 1. 将 base64 转为 Uint8Array
    const binary = atob(jpegBase64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    console.log(111111)
    // 2. 向后端获取 TOS 预签名上传 URL
    const uploadUrlInfo = await apiFetch<{ upload_url: string; object_key: string }>(`/image/upload_url?filename=layeri.png`);// 判断ok 为True
    console.log(uploadUrlInfo);
    const uploadUrl = uploadUrlInfo.upload_url;
    const object_key = uploadUrlInfo.object_key;
    console.log(object_key)
    console.log(uploadUrl)
    const base_url = "https://upload-picture.tos-cn-beijing.volces.com/"

    console.log(222222)
    const image_url = base_url + object_key
    console.log(image_url)

    // 3. 使用 PUT 直传到对象存储
    // 注意：不要在请求中添加额外的头，因为预签名 URL 已经包含了 ACL 参数
    const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/png'
        },
        body: buffer
    });

    console.log(`[DEBUG] Upload status: ${uploadResponse.status}`);
    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`[DEBUG] Upload failed: ${errorText}`);
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // # AI_Amend END

    // imageObj.dispose();
    imageObj.imageData.dispose();
    return image_url
}

export async function saveLayerAsPng(layerId: number) {
    const imageObj = await imaging.getPixels({
      layerID: layerId,
      applyAlpha: true 
    });
    console.log(3334)
    console.log(imageObj, typeof imageObj)
    console.log(imageObj.imageData)
    console.log(33343)
    console.log(imageObj.sourceBounds)
    console.log(imageObj.sourceBounds.left) // 获得图片尺寸
    console.log(33345)
    const jpegBase64 = await imaging.encodeImageData({
        "imageData": imageObj.imageData,
        "base64": true
    });
    console.log(3335)

    const file = await storage.localFileSystem.getFileForSaving("layer.png");
    if (!file) return;

    const binary = atob(jpegBase64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }

    // 5. 写入文件
    await file.write(buffer);

    // imageObj.dispose();
    imageObj.imageData.dispose();
}

/**
 * 导入图片并作为新图层（placeEvent）
 */
export async function importImageAsLayer() {
  const file = await storage.localFileSystem.getFileForOpening({
    types: ["jpg", "jpeg", "png", "webp", "tif", "tiff"],
  });
  if (!file) return;

  const token = await storage.localFileSystem.createSessionToken(file);

  await core.executeAsModal(
    async () =>
      action.batchPlay(
        [
          {
            _obj: 'placeEvent',
            null: { _path: token, _kind: 'local' },
            freeTransformCenterState: {
              _enum: 'quadCenterState',
              _value: 'QCSCorner0',
            },
            offset: {
              _obj: 'offset',
              horizontal: { _unit: 'pixelsUnit', _value: 0 },
              vertical: { _unit: 'pixelsUnit', _value: 0 },
            },
            _isCommand: true,
            _options: { dialogOptions: 'dontDisplay' },
          },
        ],
        {}
      ),
    { commandName: 'Import Image As Layer' }
  );
}



export async function importImageUrlAsLayer(imageUrl: string) {
  // # AI_Amend 2026-01-29 从远程 URL 导入图片并写入为新图层

  // 1. 下载图片
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error('图片下载失败: ' + res.status);
  }
  const arrayBuffer = await res.arrayBuffer();
  
  // 2. 写入临时文件（UXP 只能 place 本地文件）
  const tempFolder = await storage.localFileSystem.getTemporaryFolder();
  const file = await tempFolder.createFile('import.png', { overwrite: true });
  await file.write(new Uint8Array(arrayBuffer));

  // 3. 创建 session token
  const token = await storage.localFileSystem.createSessionToken(file);

  // 4. 作为新图层 place 到 Photoshop
  await core.executeAsModal(
    async () =>
      action.batchPlay(
        [
          {
            _obj: 'placeEvent',
            null: { _path: token, _kind: 'local' },
            freeTransformCenterState: {
              _enum: 'quadCenterState',
              _value: 'QCSCorner0',
            },
            offset: {
              _obj: 'offset',
              horizontal: { _unit: 'pixelsUnit', _value: 0 },
              vertical: { _unit: 'pixelsUnit', _value: 0 },
            },
            _isCommand: true,
            _options: { dialogOptions: 'dontDisplay' },
          },
        ],
        {}
      ),
    { commandName: 'Import Image As Layer From URL' }
  );
  // # AI_Amend END
}
