package services

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"dgui/models"
)

// RegistryClient Docker Registry API 客户端
type RegistryClient struct {
	BaseURL    string
	Username   string
	Password   string
	HTTPClient *http.Client
}

// NewRegistryClient 创建新的 Registry 客户端
func NewRegistryClient(registry *models.Registry) *RegistryClient {
	// 创建支持自签名证书的 HTTP 客户端
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{
		Transport: tr,
		Timeout:   30 * time.Second,
	}

	return &RegistryClient{
		BaseURL:    strings.TrimSuffix(registry.URL, "/"),
		Username:   registry.Username,
		Password:   registry.Password,
		HTTPClient: client,
	}
}

// doRequest 执行 HTTP 请求
func (c *RegistryClient) doRequest(method, path string, headers map[string]string) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", c.BaseURL, path)
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	// 添加基本认证
	if c.Username != "" && c.Password != "" {
		req.SetBasicAuth(c.Username, c.Password)
	}

	// 添加自定义头
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	return c.HTTPClient.Do(req)
}

// CheckConnection 检查连接
func (c *RegistryClient) CheckConnection() error {
	resp, err := c.doRequest("GET", "/v2/", nil)
	if err != nil {
		return fmt.Errorf("connection failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusUnauthorized {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// GetCatalog 获取仓库目录
func (c *RegistryClient) GetCatalog() (*models.RegistryCatalog, error) {
	resp, err := c.doRequest("GET", "/v2/_catalog", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get catalog: %d - %s", resp.StatusCode, string(body))
	}

	var catalog models.RegistryCatalog
	if err := json.NewDecoder(resp.Body).Decode(&catalog); err != nil {
		return nil, err
	}

	return &catalog, nil
}

// GetTags 获取镜像标签
func (c *RegistryClient) GetTags(repository string) (*models.RegistryTags, error) {
	path := fmt.Sprintf("/v2/%s/tags/list", repository)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get tags: %d - %s", resp.StatusCode, string(body))
	}

	var tags models.RegistryTags
	if err := json.NewDecoder(resp.Body).Decode(&tags); err != nil {
		return nil, err
	}

	return &tags, nil
}

// GetManifest 获取镜像清单
func (c *RegistryClient) GetManifest(repository, reference string) (*models.ImageManifest, error) {
	path := fmt.Sprintf("/v2/%s/manifests/%s", repository, reference)
	// 支持多种 manifest 格式，包括 OCI 索引和 Docker manifest list
	headers := map[string]string{
		"Accept": "application/vnd.docker.distribution.manifest.v2+json, " +
			"application/vnd.oci.image.manifest.v1+json, " +
			"application/vnd.oci.image.index.v1+json, " +
			"application/vnd.docker.distribution.manifest.list.v2+json",
	}

	resp, err := c.doRequest("GET", path, headers)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get manifest: %d - %s", resp.StatusCode, string(body))
	}

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	contentType := resp.Header.Get("Content-Type")
	digest := resp.Header.Get("Docker-Content-Digest")

	// 检查是否为 manifest list / OCI index（多架构镜像）
	if contentType == "application/vnd.docker.distribution.manifest.list.v2+json" ||
		contentType == "application/vnd.oci.image.index.v1+json" {
		// 解析 manifest list
		var manifestList models.ManifestList
		if err := json.Unmarshal(body, &manifestList); err != nil {
			return nil, err
		}

		// 选择一个平台的 manifest（优先 linux/amd64）
		var selectedDigest string
		for _, m := range manifestList.Manifests {
			if m.Platform.OS == "linux" && m.Platform.Architecture == "amd64" {
				selectedDigest = m.Digest
				break
			}
		}
		// 如果没有找到 linux/amd64，使用第一个
		if selectedDigest == "" && len(manifestList.Manifests) > 0 {
			selectedDigest = manifestList.Manifests[0].Digest
		}

		if selectedDigest == "" {
			return nil, fmt.Errorf("no suitable manifest found in manifest list")
		}

		// 递归获取具体平台的 manifest
		return c.GetManifest(repository, selectedDigest)
	}

	// 普通 manifest
	var manifest models.ImageManifest
	if err := json.Unmarshal(body, &manifest); err != nil {
		return nil, err
	}

	manifest.Digest = digest
	manifest.MediaType = contentType

	// 计算总大小
	manifest.TotalSize = manifest.Config.Size
	for _, layer := range manifest.Layers {
		manifest.TotalSize += layer.Size
	}

	return &manifest, nil
}

// GetImageConfig 获取镜像配置
func (c *RegistryClient) GetImageConfig(repository string, configDigest string) (*models.ImageConfig, error) {
	path := fmt.Sprintf("/v2/%s/blobs/%s", repository, configDigest)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get config: %d - %s", resp.StatusCode, string(body))
	}

	var config models.ImageConfig
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, err
	}

	return &config, nil
}

// GetImageInfo 获取镜像完整信息
func (c *RegistryClient) GetImageInfo(repository, tag string) (*models.ImageInfo, error) {
	// 获取清单
	manifest, err := c.GetManifest(repository, tag)
	if err != nil {
		return nil, err
	}

	// 获取配置
	config, err := c.GetImageConfig(repository, manifest.Config.Digest)
	if err != nil {
		return nil, err
	}

	return &models.ImageInfo{
		Name:       repository,
		Tag:        tag,
		Digest:     manifest.Digest,
		Manifest:   *manifest,
		Config:     *config,
		TotalSize:  manifest.TotalSize,
		LayerCount: len(manifest.Layers),
	}, nil
}

// DeleteManifest 删除镜像清单
func (c *RegistryClient) DeleteManifest(repository, digest string) error {
	path := fmt.Sprintf("/v2/%s/manifests/%s", repository, digest)
	resp, err := c.doRequest("DELETE", path, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete manifest: %d - %s", resp.StatusCode, string(body))
	}

	return nil
}

// GetRepositoryInfo 获取仓库信息
func (c *RegistryClient) GetRepositoryInfo(repository string) (*models.RepositoryInfo, error) {
	tags, err := c.GetTags(repository)
	if err != nil {
		return nil, err
	}

	return &models.RepositoryInfo{
		Name:     repository,
		Tags:     tags.Tags,
		TagCount: len(tags.Tags),
	}, nil
}
