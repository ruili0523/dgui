package routes

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"dgui/handlers"
	"dgui/middleware"
)

// SetupRouter 设置路由
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS 配置 - 仅在开发模式下需要
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API 路由组
	api := r.Group("/api")
	{
		// 公开路由 - 登录
		api.POST("/login", handlers.Login)

		// 需要认证的路由
		authorized := api.Group("")
		authorized.Use(middleware.AuthRequired())
		{
			// 用户相关
			authorized.GET("/user/me", handlers.GetCurrentUser)
			authorized.POST("/user/password", handlers.ChangePassword)

			// Registry 管理
			registries := authorized.Group("/registries")
			{
				registries.GET("", handlers.GetRegistries)
				registries.GET("/active", handlers.GetActiveRegistry)
				registries.GET("/detail", handlers.GetRegistry) // ?id=xxx
				registries.POST("", handlers.CreateRegistry)
				registries.PUT("", handlers.UpdateRegistry)              // ?id=xxx
				registries.DELETE("", handlers.DeleteRegistry)           // ?id=xxx
				registries.POST("/activate", handlers.SetActiveRegistry) // ?id=xxx
				registries.GET("/test", handlers.TestRegistryConnection) // ?id=xxx
			}

			// Docker Registry 镜像操作
			images := authorized.Group("/images")
			{
				images.GET("/catalog", handlers.GetCatalog)
				images.GET("/repositories", handlers.GetRepositories)
				images.GET("/tags", handlers.GetTags)              // ?repo=xxx&page=1&page_size=20
				images.GET("/manifest", handlers.GetImageManifest) // ?repo=xxx&ref=xxx
				images.GET("/info", handlers.GetImageInfo)         // ?repo=xxx&tag=xxx
				images.GET("/config", handlers.GetImageConfig)     // ?repo=xxx&digest=xxx
				images.DELETE("/delete", handlers.DeleteImage)     // ?repo=xxx&ref=xxx
			}
		}
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 静态文件服务 - 用于生产环境
	staticDir := "./static"

	// 使用 NoRoute 处理静态文件
	r.NoRoute(func(c *gin.Context) {
		requestPath := c.Request.URL.Path
		// 尝试查找请求的路径是否对应一个实际存在的静态文件
		filePath := staticDir + requestPath
		// 检查文件是否存在
		_, err := os.Stat(filePath)
		// 如果文件不存在，或者请求的是一个目录（但不是根目录），重定向到 index.html
		if os.IsNotExist(err) || (os.IsPermission(err) && requestPath != "/") {
			c.Redirect(302, "/index.html")
			return
		}
		// 如果文件存在，则直接提供该文件
		c.File(filePath)
	})

	return r
}
