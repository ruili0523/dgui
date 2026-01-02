package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"dgui/models"
)

var DB *gorm.DB

// InitConfig 初始化配置
func InitConfig() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

// InitDB 初始化数据库
func InitDB() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/dgui.db"
	}

	// 确保目录存在
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatalf("Failed to create database directory: %v", err)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 自动迁移
	err = DB.AutoMigrate(&models.Registry{}, &models.User{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化管理员账户
	initAdminUser()

	log.Println("Database initialized successfully")
}

// initAdminUser 初始化管理员账户
func initAdminUser() {
	adminUser := os.Getenv("ADMIN_USER")
	adminPass := os.Getenv("ADMIN_PASS")

	if adminUser == "" {
		adminUser = "admin"
	}
	if adminPass == "" {
		adminPass = "admin123"
	}

	// 检查管理员是否已存在
	var existingAdmin models.User
	result := DB.Where("username = ?", adminUser).First(&existingAdmin)

	if result.Error != nil {
		// 管理员不存在，创建新的
		admin := models.User{
			Username: adminUser,
			IsAdmin:  true,
		}
		if err := admin.SetPassword(adminPass); err != nil {
			log.Printf("Failed to set admin password: %v", err)
			return
		}

		if err := DB.Create(&admin).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
			return
		}

		log.Printf("Admin user '%s' created successfully", adminUser)
	} else {
		log.Printf("Admin user '%s' already exists", adminUser)
	}
}

// GetPort 获取服务器端口
func GetPort() string {
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "5008"
	}
	return port
}
