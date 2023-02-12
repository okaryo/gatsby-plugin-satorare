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
          padding: 32,
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
            padding: 32,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: 32, maxWidth: 470, fontWeight: 600 }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 8, gap: 8 }}>
              {tags.map((tag, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 16,
                    fontWeight: 400,
                    backgroundColor: '#e5e7eb',
                    padding: '4px 12px',
                    borderRadius: 100,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 400, display: 'flex', alignItems: 'center' }}>
              <img
                src="https://avatars.githubusercontent.com/u/44517313?v=4"
                width={36}
                height={36}
                style={{ borderRadius: '50%', marginRight: 12 }}
              />
              okaryo
            </div>
          </div>
        </div>
      </div>
    ),
    options: {
      width: 600,
      height: 400
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
return (
  <>
    {/* other meta tags */}
    <meta property='og:image' content={data.markdownRemark.ogImage.publicURL} />
    {/* other meta tags */}
  <>
)
```

#### 5. Finished!
![346297c51ed5accb21d742efde7fac41](https://user-images.githubusercontent.com/44517313/218300623-21a0aff5-2b83-473c-9279-92f1d996484c.png)
