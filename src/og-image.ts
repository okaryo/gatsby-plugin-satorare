import type { ReactNode } from 'react'

export class OgImage {
  constructor(
    readonly image: ReactNode,
    readonly options: OgImageOptions,
  ) {}
}

export type OgImageOptions = {
  width: number
  height: number
}

// TODO: ユーザー側でFontを選択できるようにする(いつか)
// export type GatsbyOgFontOptions = {
//   data: Buffer | ArrayBuffer
//   name: string
// }
