import {ImageDetail} from '@/components/ImageDetail';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';

import {imageApi, type RepositoryInfo} from '@/lib/api';
import {formatBytes} from '@/lib/format';
import {useRegistryStore} from '@/store/registry';
import {useQuery} from '@tanstack/react-query';
import {CheckCircle2, ChevronLeft, ChevronRight, Copy, Package, RefreshCw, Search, Tag} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';

// 分页组件
function Pagination({
                      page,
                      totalPages,
                      total,
                      pageSize,
                      onPageChange,
                      onPageSizeChange,
                    }: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        显示 {start}-{end}，共 {total} 条
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">每页</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-17.5 h-8">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4"/>
          </Button>
          <span className="text-sm px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4"/>
          </Button>
        </div>
      </div>
    </div>
  );
}

// 从 registry URL 提取主机地址
function getRegistryHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

// 标签信息组件
function TagCard({
                   repository,
                   tag,
                   onSelect
                 }: {
  repository: string
  tag: string
  onSelect: () => void
}) {
  const [copied, setCopied] = useState(false);
  const activeRegistry = useRegistryStore((state) => state.activeRegistry);

  const {data: imageInfo, isLoading} = useQuery({
    queryKey: ['imageInfo', repository, tag],
    queryFn: () => imageApi.getImageInfo(repository, tag).then(res => res.data),
    staleTime: 60000,
  });

  const registryHost = activeRegistry?.url ? getRegistryHost(activeRegistry.url) : '';
  const pullCommand = registryHost
    ? `docker pull ${registryHost}/${repository}:${tag}`
    : `docker pull ${repository}:${tag}`;

  const copyPullCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pullCommand).then();
    setCopied(true);
    toast.success('已复制 Pull 命令');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow gap-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TAG</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={onSelect}
            className="text-lg font-semibold text-primary hover:underline text-left"
          >
            {tag}
          </button>
          <div className="flex items-center gap-2">
            <code
              className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-140 text-nowrap hidden overflow-auto lg:block">
              {pullCommand}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={copyPullCommand}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500"/>
              ) : (
                <Copy className="h-4 w-4"/>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground"/>
          </div>
        ) : imageInfo ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 text-sm p-1">
              <div>
                <p className="text-muted-foreground text-xs">Digest</p>
                <p className="font-mono text-xs truncate">{imageInfo.digest}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">OS/ARCH</p>
                  <p className="font-medium">{imageInfo.config?.os}/{imageInfo.config?.architecture}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">压缩大小</p>
                  <p className="font-medium">{formatBytes(imageInfo.manifest?.totalSize || 0)}</p>
                </div>
              </div>
            </div>
            <Separator/>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{imageInfo.layer_count} 层</span>
              <Button variant="ghost" size="sm" onClick={onSelect} className="h-7 text-xs">
                查看详情 →
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">加载失败</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ImageBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 参数读取状态
  const selectedRepo = searchParams.get('repo');
  const selectedTag = searchParams.get('tag');

  // 仓库分页状态
  const [repoPage, setRepoPage] = useState(1);
  const [repoPageSize, setRepoPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // 标签分页状态
  const [tagPage, setTagPage] = useState(1);
  const [tagPageSize, setTagPageSize] = useState(20);
  const [tagFilter, setTagFilter] = useState('');
  const [tagFilterInput, setTagFilterInput] = useState('');

  // 当 selectedRepo 变化时重置标签分页状态
  useEffect(() => {
    setTagPage(1);
    setTagFilter('');
    setTagFilterInput('');
  }, [selectedRepo]);

  // 获取仓库列表（带分页）
  const {data: repoData, isLoading, error, refetch} = useQuery({
    queryKey: ['repositories', repoPage, repoPageSize, searchTerm],
    queryFn: () => imageApi.getRepositories({
      page: repoPage,
      page_size: repoPageSize,
      search: searchTerm
    }).then(res => res.data),
    retry: false,
  });

  // 获取标签列表（带分页）
  const {data: tagData, isLoading: tagLoading} = useQuery({
    queryKey: ['tags', selectedRepo, tagPage, tagPageSize, tagFilter],
    queryFn: () => selectedRepo
      ? imageApi.getTags(selectedRepo, {
        page: tagPage,
        page_size: tagPageSize,
        search: tagFilter
      }).then(res => res.data)
      : null,
    enabled: !!selectedRepo && !selectedTag,
  });

  const handleRepoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setRepoPage(1);
  };

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTagFilter(tagFilterInput);
    setTagPage(1);
  };

  const handleRepoPageSizeChange = (size: number) => {
    setRepoPageSize(size);
    setRepoPage(1);
  };

  const handleTagPageSizeChange = (size: number) => {
    setTagPageSize(size);
    setTagPage(1);
  };

  const handleSelectRepo = (name: string) => {
    setSearchParams({repo: name});
  };

  const handleSelectTag = (tag: string) => {
    if (selectedRepo) {
      setSearchParams({repo: selectedRepo, tag});
    }
  };

  const handleBackToTags = () => {
    if (selectedRepo) {
      setSearchParams({repo: selectedRepo});
    }
  };

  const handleBackToRepos = () => {
    setSearchParams({});
    setTagPage(1);
    setTagFilter('');
    setTagFilterInput('');
  };

  if (selectedRepo && selectedTag) {
    return (
      <ImageDetail
        repository={selectedRepo}
        tag={selectedTag}
        onBack={handleBackToTags}
      />
    );
  }

  if (selectedRepo) {
    const tags = tagData?.data?.tags || [];
    const totalTags = tagData?.total || 0;
    const totalTagPages = tagData?.total_pages || 1;

    return (
      <div className="space-y-6">
        {/* 仓库头部信息 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={handleBackToRepos}
            className="hover:text-foreground"
          >
            镜像仓库
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{selectedRepo}</span>
        </div>

        <div className="flex items-start gap-6 pb-6 border-b">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary text-white">
            <Package className="h-10 w-10"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{selectedRepo}</h1>
              <Badge variant="secondary">Docker Image</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              私有镜像仓库
            </p>
            <div className="flex items-center gap-6 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4 text-muted-foreground"/>
                <span>{totalTags} 个标签</span>
              </div>
            </div>
          </div>
        </div>

        {/* 标签过滤 */}
        <form onSubmit={handleTagSearch} className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input
              placeholder="搜索标签..."
              value={tagFilterInput}
              onChange={(e) => setTagFilterInput(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            搜索
          </Button>
        </form>

        {/* 标签列表 - 卡片形式 */}
        {tagLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground"/>
              <p className="mt-4 text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : tags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground">
                {tagFilter ? '没有找到匹配的标签' : '该仓库没有标签'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {tags.map((tag: string) => (
                <TagCard
                  key={tag}
                  repository={selectedRepo}
                  tag={tag}
                  onSelect={() => handleSelectTag(tag)}
                />
              ))}
            </div>

            {/* 分页 */}
            {totalTagPages > 1 && (
              <Pagination
                page={tagPage}
                totalPages={totalTagPages}
                total={totalTags}
                pageSize={tagPageSize}
                onPageChange={setTagPage}
                onPageSizeChange={handleTagPageSizeChange}
              />
            )}
          </>
        )}
      </div>
    );
  }

  const repositories = repoData?.data || [];
  const totalRepos = repoData?.total || 0;
  const totalRepoPages = repoData?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">镜像仓库</h1>
          <p className="text-muted-foreground mt-1">
            浏览和管理 Docker Registry 中的镜像
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => refetch()}>
          <RefreshCw className="size-4"/>
          <span className="hidden sm:block">刷新</span>
        </Button>
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleRepoSearch} className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input
            placeholder="搜索镜像仓库..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          搜索
        </Button>
      </form>

      {/* 镜像列表 - 卡片网格 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground"/>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <Package className="h-6 w-6 text-destructive"/>
            </div>
            <p className="text-destructive font-medium mb-2">加载失败</p>
            <p className="text-muted-foreground text-sm mb-4 text-center">
              请确保已选择有效的 Registry 并且连接正常
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              重试
            </Button>
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Package className="h-6 w-6 text-muted-foreground"/>
            </div>
            <p className="text-muted-foreground">
              {searchTerm ? '没有找到匹配的镜像' : 'Registry 中没有镜像'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo: RepositoryInfo) => (
              <Card
                key={repo.name}
                className="cursor-pointer hover:shadow-md transition-shadow gap-2"
                onClick={() => handleSelectRepo(repo.name)}
              >
                <CardHeader className="pb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    IMAGE
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 镜像名称和图标 */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary text-white">
                      <Package className="h-6 w-6"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">Docker Image</p>
                    </div>
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    私有镜像仓库
                  </p>

                  <Separator/>

                  {/* 统计信息 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tags</span>
                      <span className="font-medium">{repo.tag_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分页 */}
          {totalRepoPages > 1 && (
            <Pagination
              page={repoPage}
              totalPages={totalRepoPages}
              total={totalRepos}
              pageSize={repoPageSize}
              onPageChange={setRepoPage}
              onPageSizeChange={handleRepoPageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}
