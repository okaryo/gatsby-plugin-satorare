 🚧 There is still a bug in this plugin. 🚧

## gatsby-plugin-satorare
This plugin uses [vercel/satori](https://github.com/vercel/satori) internally and supports OG image generation in JSX syntax.

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
Default export a function that returns an object with `image` and `options` as follows.

```tsx
type MyFrontmatter = {
  title: string
}

export default function(frontmatter: MyFrontmatter) {
  const title = frontmatter.title

  return {
    image: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          color: 'black',
          backgroundColor: 'green'
        }}
      >
        <p>{title}</p>
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
