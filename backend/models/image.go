package models

// RegistryCatalog Docker Registry 目录响应
type RegistryCatalog struct {
	Repositories []string `json:"repositories"`
}

// RegistryTags 镜像标签列表
type RegistryTags struct {
	Name string   `json:"name"`
	Tags []string `json:"tags"`
}

// ImageManifest 镜像清单
type ImageManifest struct {
	SchemaVersion int             `json:"schemaVersion"`
	MediaType     string          `json:"mediaType"`
	Config        ManifestConfig  `json:"config"`
	Layers        []ManifestLayer `json:"layers"`
	Digest        string          `json:"digest"`
	TotalSize     int64           `json:"totalSize"`
}

// ManifestConfig 清单配置
type ManifestConfig struct {
	MediaType string `json:"mediaType"`
	Size      int64  `json:"size"`
	Digest    string `json:"digest"`
}

// ManifestLayer 清单层
type ManifestLayer struct {
	MediaType string `json:"mediaType"`
	Size      int64  `json:"size"`
	Digest    string `json:"digest"`
}

// ManifestPlatform 平台信息（用于多架构镜像）
type ManifestPlatform struct {
	Architecture string `json:"architecture"`
	OS           string `json:"os"`
	Variant      string `json:"variant,omitempty"`
}

// ManifestDescriptor manifest 描述符（用于 manifest list / OCI index）
type ManifestDescriptor struct {
	MediaType string           `json:"mediaType"`
	Size      int64            `json:"size"`
	Digest    string           `json:"digest"`
	Platform  ManifestPlatform `json:"platform"`
}

// ManifestList 多架构镜像清单列表
type ManifestList struct {
	SchemaVersion int                  `json:"schemaVersion"`
	MediaType     string               `json:"mediaType"`
	Manifests     []ManifestDescriptor `json:"manifests"`
}

// ImageConfig 镜像配置详情
type ImageConfig struct {
	Architecture  string          `json:"architecture"`
	OS            string          `json:"os"`
	Created       string          `json:"created"`
	Author        string          `json:"author"`
	DockerVersion string          `json:"docker_version"`
	Config        ContainerConfig `json:"config"`
	History       []HistoryEntry  `json:"history"`
	RootFS        RootFS          `json:"rootfs"`
}

// ContainerConfig 容器配置
type ContainerConfig struct {
	Hostname     string              `json:"Hostname"`
	Domainname   string              `json:"Domainname"`
	User         string              `json:"User"`
	ExposedPorts map[string]struct{} `json:"ExposedPorts"`
	Env          []string            `json:"Env"`
	Cmd          []string            `json:"Cmd"`
	Image        string              `json:"Image"`
	Volumes      map[string]struct{} `json:"Volumes"`
	WorkingDir   string              `json:"WorkingDir"`
	Entrypoint   []string            `json:"Entrypoint"`
	Labels       map[string]string   `json:"Labels"`
}

// HistoryEntry 历史记录条目
type HistoryEntry struct {
	Created    string `json:"created"`
	CreatedBy  string `json:"created_by"`
	EmptyLayer bool   `json:"empty_layer"`
	Comment    string `json:"comment"`
}

// RootFS 根文件系统信息
type RootFS struct {
	Type    string   `json:"type"`
	DiffIDs []string `json:"diff_ids"`
}

// ImageInfo 镜像完整信息
type ImageInfo struct {
	Name       string        `json:"name"`
	Tag        string        `json:"tag"`
	Digest     string        `json:"digest"`
	Manifest   ImageManifest `json:"manifest"`
	Config     ImageConfig   `json:"config"`
	TotalSize  int64         `json:"total_size"`
	LayerCount int           `json:"layer_count"`
}

// RepositoryInfo 仓库信息
type RepositoryInfo struct {
	Name     string   `json:"name"`
	Tags     []string `json:"tags"`
	TagCount int      `json:"tag_count"`
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

// TagInfo 标签详细信息
type TagInfo struct {
	Name       string `json:"name"`
	Digest     string `json:"digest"`
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	Size       int64  `json:"size"`
	LayerCount int    `json:"layer_count"`
	Created    string `json:"created"`
}
