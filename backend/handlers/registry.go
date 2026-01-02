package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"dgui/config"
	"dgui/models"
)

// GetRegistries 获取所有 Registry
func GetRegistries(c *gin.Context) {
	var registries []models.Registry
	if err := config.DB.Find(&registries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, registries)
}

// GetRegistry 获取单个 Registry
func GetRegistry(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}
	var registry models.Registry
	if err := config.DB.First(&registry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registry not found"})
		return
	}
	c.JSON(http.StatusOK, registry)
}

// GetActiveRegistry 获取当前激活的 Registry
func GetActiveRegistry(c *gin.Context) {
	var registry models.Registry
	if err := config.DB.Where("is_active = ?", true).First(&registry).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active registry"})
		return
	}
	c.JSON(http.StatusOK, registry)
}

// CreateRegistry 创建 Registry
func CreateRegistry(c *gin.Context) {
	var req models.RegistryCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	registry := models.Registry{
		Name:     req.Name,
		URL:      req.URL,
		Username: req.Username,
		Password: req.Password,
	}

	// 如果是第一个 registry，设为活跃
	var count int64
	config.DB.Model(&models.Registry{}).Count(&count)
	if count == 0 {
		registry.IsActive = true
		registry.IsDefault = true
	}

	if err := config.DB.Create(&registry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, registry)
}

// UpdateRegistry 更新 Registry
func UpdateRegistry(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}
	var registry models.Registry
	if err := config.DB.First(&registry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registry not found"})
		return
	}

	var req models.RegistryUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.URL != "" {
		updates["url"] = req.URL
	}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Password != "" {
		updates["password"] = req.Password
	}

	if err := config.DB.Model(&registry).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, registry)
}

// DeleteRegistry 删除 Registry
func DeleteRegistry(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}
	var registry models.Registry
	if err := config.DB.First(&registry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registry not found"})
		return
	}

	if err := config.DB.Delete(&registry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registry deleted"})
}

// SetActiveRegistry 设置活跃的 Registry
func SetActiveRegistry(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}
	var registry models.Registry
	if err := config.DB.First(&registry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registry not found"})
		return
	}

	// 取消其他 registry 的活跃状态
	config.DB.Model(&models.Registry{}).Where("is_active = ?", true).Update("is_active", false)

	// 设置当前 registry 为活跃
	config.DB.Model(&registry).Update("is_active", true)

	c.JSON(http.StatusOK, registry)
}

// TestRegistryConnection 测试 Registry 连接
func TestRegistryConnection(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}
	var registry models.Registry
	if err := config.DB.First(&registry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registry not found"})
		return
	}

	client := NewRegistryClientFromModel(&registry)
	if err := client.CheckConnection(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "connected": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Connection successful", "connected": true})
}
