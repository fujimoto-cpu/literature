import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "📚 Literature Notes",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: false,
    analytics: null,
    locale: "ja-JP",
    baseUrl: "fujimoto-cpu.github.io/literature",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Sans JP",
        body: "Noto Sans JP",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf9f7",
          lightgray: "#f0edea",
          gray: "#9a9a9a",
          darkgray: "#4e4e4e",
          dark: "#2d2d2d",
          secondary: "#b8538a",
          tertiary: "#8a6dc4",
          highlight: "rgba(232, 160, 191, 0.15)",
          textHighlight: "#e8a0bf44",
        },
        darkMode: {
          light: "#1a1a1d",
          lightgray: "#2d2d30",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#e8a0bf",
          tertiary: "#c5b4e3",
          highlight: "rgba(232, 160, 191, 0.15)",
          textHighlight: "#e8a0bf44",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // CustomOgImages disabled for faster builds
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
