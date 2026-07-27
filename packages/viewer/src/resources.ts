import * as THREE from 'three/webgpu';

export function disposeObject(root: any): void {
  if (!root) return;
  root.traverse?.((object: any) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material) as any[]) {
        if (value?.isTexture) value.dispose?.();
      }
      material.dispose?.();
    }
  });
  root.removeFromParent?.();
}

export function fitObjectToView(root: any, camera: any, controls: any): void {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.001);
  root.position.sub(sphere.center);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = Math.max(radius * 100, 100);
  camera.position.set(radius * 1.8, radius * 1.2, radius * 2.2);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = radius * 0.2;
  controls.maxDistance = radius * 20;
  controls.update();
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas capture returned no data.'))),
      mimeType,
      quality
    );
  });
}
