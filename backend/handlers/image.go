package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"dgui/config"
	"dgui/models"
	"dgui/services"
)

// NewRegistryClientFromModel 从模型创建客户端
func NewRegistryClientFromModel(registry *models.Registry) *services.RegistryClient {
	return services.NewRegistryClient(registry)
}

// getActiveRegistryClient 获取活跃 Registry 客户端
func getActiveRegistryClient() (*services.RegistryClient, *models.Registry, error) {
	var registry models.Registry
	if err := config.DB.Where("is_active = ?", true).First(&registry).Error; err != nil {
		return nil, nil, err
	}
	return services.NewRegistryClient(&registry), &registry, nil
}

// GetCatalog 获取镜像目录
func GetCatalog(c *gin.Context) {
	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	catalog, err := client.GetCatalog()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, catalog)
}

// GetRepositories 获取仓库列表（带详细信息和分页）
func GetRepositories(c *gin.Context) {
	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	catalog, err := client.GetCatalog()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 过滤搜索
	var filteredRepos []string
	for _, repo := range catalog.Repositories {
		if search == "" || containsIgnoreCase(repo, search) {
			filteredRepos = append(filteredRepos, repo)
		}
	}

	total := len(filteredRepos)
	totalPages := (total + pageSize - 1) / pageSize

	// 计算分页
	start := (page - 1) * pageSize
	end := start + pageSize
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	// 获取当前页的仓库详情
	var repos []models.RepositoryInfo
	for _, repo := range filteredRepos[start:end] {
		info, err := client.GetRepositoryInfo(repo)
		if err != nil {
			// 跳过错误的仓库
			continue
		}
		repos = append(repos, *info)
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       repos,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// containsIgnoreCase 忽略大小写的字符串包含检查
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > 0 && len(substr) > 0 && containsLower(toLower(s), toLower(substr))))
}

func toLower(s string) string {
	b := make([]byte, len(s))
	for i := range s {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		b[i] = c
	}
	return string(b)
}

func containsLower(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// GetTags 获取镜像标签（带分页）
func GetTags(c *gin.Context) {
	repository := c.Query("repo")
	if repository == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repo parameter is required"})
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	tags, err := client.GetTags(repository)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 过滤搜索
	var filteredTags []string
	for _, tag := range tags.Tags {
		if search == "" || containsIgnoreCase(tag, search) {
			filteredTags = append(filteredTags, tag)
		}
	}

	total := len(filteredTags)
	totalPages := (total + pageSize - 1) / pageSize

	// 计算分页
	start := (page - 1) * pageSize
	end := start + pageSize
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	pagedTags := filteredTags[start:end]

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data: map[string]interface{}{
			"name": repository,
			"tags": pagedTags,
		},
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// GetImageManifest 获取镜像清单
func GetImageManifest(c *gin.Context) {
	repository := c.Query("repo")
	reference := c.Query("ref")
	if repository == "" || reference == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repo and ref parameters are required"})
		return
	}

	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	manifest, err := client.GetManifest(repository, reference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, manifest)
}

// GetImageInfo 获取镜像完整信息
func GetImageInfo(c *gin.Context) {
	repository := c.Query("repo")
	tag := c.Query("tag")
	if repository == "" || tag == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repo and tag parameters are required"})
		return
	}

	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	info, err := client.GetImageInfo(repository, tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

// DeleteImage 删除镜像
func DeleteImage(c *gin.Context) {
	repository := c.Query("repo")
	reference := c.Query("ref")
	if repository == "" || reference == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repo and ref parameters are required"})
		return
	}

	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	// 首先获取 digest
	manifest, err := client.GetManifest(repository, reference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 使用 digest 删除
	if err := client.DeleteManifest(repository, manifest.Digest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

// GetImageConfig 获取镜像配置
func GetImageConfig(c *gin.Context) {
	repository := c.Query("repo")
	digest := c.Query("digest")
	if repository == "" || digest == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repo and digest parameters are required"})
		return
	}

	client, _, err := getActiveRegistryClient()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active registry"})
		return
	}

	configData, err := client.GetImageConfig(repository, digest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, configData)
}
