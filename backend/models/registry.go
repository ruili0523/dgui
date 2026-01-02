package models

import (
	"time"

	"gorm.io/gorm"
)

// Registry 表示一个 Docker Registry 配置
type Registry struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Name      string         `gorm:"size:100;not null" json:"name"`
	URL       string         `gorm:"size:500;not null" json:"url"`
	Username  string         `gorm:"size:100" json:"username"`
	Password  string         `gorm:"size:500" json:"-"`
	IsActive  bool           `gorm:"default:false" json:"is_active"`
	IsDefault bool           `gorm:"default:false" json:"is_default"`
}

// RegistryCreate 创建 Registry 的请求
type RegistryCreate struct {
	Name     string `json:"name" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegistryUpdate 更新 Registry 的请求
type RegistryUpdate struct {
	Name     string `json:"name"`
	URL      string `json:"url"`
	Username string `json:"username"`
	Password string `json:"password"`
}
