## gatsby-plugin-satorare
This plugin uses [vercel/satori](https://github.com/vercel/satori) internally and supports OG image generation in JSX syntax.

### 🚧 Warning 🚧
This plugin is still in beta and unstable.

- It only supports MarkdownRemark nodes.
- Font cannot be selected. The default is [Noto Sans Japanese](https://fonts.google.com/noto/specimen/Noto+Sans+JP?selected=Material+Icons).
- Usage may change drastically.

### Installation

```sh
npm i --save gatsby-plugin-satorare
```

### Usage
#### 1. Setup gatsby-config
```js
// In your gatsby-config.js
plugins: [
  // ... other plugins
  {
    resolve: `gatsby-plugin-satorare`,
    options: {
      source: `${__dirname}/src/components/OgImage.tsx`
    }
  },
  // ... other plugins
]
```

#### 2. Create OG file with JSX/TSX
The following frontmatter is assumed.

```md
---
title: "Hello World"
tags: ["Gatsby", "og:image"]
---
```

Default export a function that returns an object with `image` and `options` as follows. You can get frontmatter data from the argument.

```tsx
// ./src/components/OgImage.tsx
type MyFrontmatter = {
  title: string
  tags: string[]
}

export default function(frontmatter: MyFrontmatter) {
  const { title, tags } = frontmatter

  return {
    image: (
      <div
        style={{
          display: 'flex',
          padding: 48,
          height: '100%',
          backgroundColor: '#2e3440',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            backgroundColor: 'white',
            color: '#000000d1',
            padding: 48,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: 64, maxWidth: 1000, fontWeight: 600 }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 16, gap: 16 }}>
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 32,
                    fontWeight: 400,
                    backgroundColor: 'rgb(229,231,235)',
                    padding: '8px 24px',
                    borderRadius: 200,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ fontSize: 48, fontWeight: 400, display: 'flex', alignItems: 'center' }}>
              <img
                src="https://avatars.githubusercontent.com/u/44517313?v=4"
                width={72}
                height={72}
                style={{ borderRadius: '50%', marginRight: 16 }}
              />
              okaryo
            </div>
          </div>
        </div>
      </div>
    ),
    options: {
      width: 1200,
      height: 630
    }
  }
}
```

#### 3. Read OG Image path from query
```js
// query
`
query MyQuery {
  markdownRemark(id: {eq: "45a4a997-f230-56cc-a94a-004db0b667d7"}) {
    ogImage {
      publicURL
    }
  }
}
`

// result
{
  "data": {
    "markdownRemark": {
      "ogImage": {
        "publicURL": "/static/8d5a6b2a951985acb20f041bf8f52e61/8d5a6b2a951985acb20f041bf8f52e61.png"
      }
    }
  }
}
```

#### 4. Set meta tag
```jsx
const yourSite = 'https://example.com'

return (
  <>
    {/* other meta tags */}
    <meta property='og:image' content={`${yourSite}${data.markdownRemark.ogImage.publicURL}`} />
    {/* other meta tags */}
  <>
)
```

#### 5. Finished!
![og:image](https://user-images.githubusercontent.com/44517313/218302838-61784400-4b6f-422b-8512-45b8bb9d433d.png)
