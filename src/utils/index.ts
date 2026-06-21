export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const formatDateTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${mo}-${d} ${h}:${m}`;
};

export const formatFullDateTime = (timeStr: string): string => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${m}`;
};

export const getDurationText = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
};

export const persistPhotoPath = async (tempPath: string): Promise<string> => {
  if (!tempPath) return tempPath;
  if (tempPath.startsWith('data:') || tempPath.startsWith('http')) return tempPath;
  try {
    const fs = Taro.getFileSystemManager();
    const saveRes: any = await new Promise((resolve, reject) => {
      fs.saveFile({
        tempFilePath: tempPath,
        success: resolve,
        fail: reject
      });
    });
    return saveRes.savedFilePath || tempPath;
  } catch (e) {
    try {
      const fs = Taro.getFileSystemManager();
      const base64Res: any = await new Promise((resolve, reject) => {
        fs.readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: resolve,
          fail: reject
        });
      });
      const data = base64Res.data;
      const extMatch = tempPath.match(/\.(png|jpg|jpeg|gif|webp)/i);
      const mime = extMatch ? `image/${extMatch[1] === 'jpg' ? 'jpeg' : extMatch[1]}` : 'image/jpeg';
      return `data:${mime};base64,${data}`;
    } catch (e2) {
      return tempPath;
    }
  }
};

export const persistPhotos = async (tempPaths: string[]): Promise<string[]> => {
  const results = await Promise.all(tempPaths.map(p => persistPhotoPath(p)));
  return results;
};
