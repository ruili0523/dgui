import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Layers,
  Clock,
  HardDrive,
  Cpu,
  Terminal,
  Tag,
  Hash,
  Trash2,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

import { imageApi } from '@/lib/api'
import { formatBytes, formatDate, shortenDigest, parseDockerCommand } from '@/lib/format'
import { useRegistryStore } from '@/store/registry'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ImageDetailProps {
  repository: string
  tag: string
  onBack: () => void
}

// 从 registry URL 提取主机地址
function getRegistryHost(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.host
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }
}

export function ImageDetail({ repository, tag, onBack }: ImageDetailProps) {
  const queryClient = useQueryClient()
  const [copiedDigest, setCopiedDigest] = useState<string | null>(null)
  const activeRegistry = useRegistryStore((state) => state.activeRegistry)

  const { data: imageInfo, isLoading, error } = useQuery({
    queryKey: ['imageInfo', repository, tag],
    queryFn: () => imageApi.getImageInfo(repository, tag).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => imageApi.deleteImage(repository, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      toast.success('镜像删除成功')
      onBack()
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`)
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then()
    setCopiedDigest(text)
    toast.success(`已复制 ${label}`)
    setTimeout(() => setCopiedDigest(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="text-center py-10 text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (error || !imageInfo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-destructive">加载镜像信息失败</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const registryHost = activeRegistry?.url ? getRegistryHost(activeRegistry.url) : ''
  const pullCommand = registryHost 
    ? `docker pull ${registryHost}/${repository}:${tag}`
    : `docker pull ${repository}:${tag}`

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="flex items-center gap-2" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:block">返回</span>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {repository}:{tag}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Hash className="h-3 w-3" />
                {shortenDigest(imageInfo.digest)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(imageInfo.digest, 'Digest')}
                >
                  {copiedDigest === imageInfo.digest ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:block">删除镜像</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除镜像 {repository}:{tag} 吗？此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Pull 命令 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between bg-muted rounded-md px-4 py-2">
              <code className="flex-1 min-w-0 overflow-auto text-nowrap text-sm">{pullCommand}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(pullCommand, 'Pull 命令')}
              >
                {copiedDigest === pullCommand ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 概览卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总大小</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(imageInfo.manifest.totalSize)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">层数</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{imageInfo.layer_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">架构</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {imageInfo.config.architecture}/{imageInfo.config.os}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">创建时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatDate(imageInfo.config.created)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息选项卡 */}
        <Tabs defaultValue="layers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="layers">镜像层</TabsTrigger>
            <TabsTrigger value="history">构建历史</TabsTrigger>
            <TabsTrigger value="config">配置信息</TabsTrigger>
            <TabsTrigger value="env">环境变量</TabsTrigger>
            <TabsTrigger value="labels">标签</TabsTrigger>
          </TabsList>

          <TabsContent value="layers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>镜像层信息</CardTitle>
                <CardDescription>
                  镜像由 {imageInfo.manifest.layers.length} 个层组成
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-100 min-h-20 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-140">Digest</TableHead>
                        <TableHead className="w-80">Media Type</TableHead>
                        <TableHead className="text-right">大小</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imageInfo.manifest.layers.map((layer, index) => (
                        <TableRow key={layer.digest}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="flex w-140">
                            <Tooltip>
                              <TooltipTrigger className=" w-full truncate font-mono text-xs">
                                {layer.digest}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{layer.digest}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell  className="w-80">
                            <Badge variant="outline" className="font-mono text-xs">
                              {layer.mediaType.split('.').pop()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBytes(layer.size)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>构建历史</CardTitle>
                <CardDescription>Dockerfile 构建步骤</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-100 min-h-20 overflow-auto">
                  <div className="space-y-3">
                    {imageInfo.config.history?.map((entry, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md ${
                          entry.empty_layer ? 'bg-muted/50' : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-1">
                            {entry.empty_layer ? (
                              <Tag className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Layers className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                #{imageInfo.config.history!.length - index}
                              </Badge>
                              {entry.empty_layer && (
                                <Badge variant="secondary" className="text-xs">
                                  空层
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(entry.created)}
                              </span>
                            </div>
                            <code className="text-xs break-all whitespace-pre-wrap">
                              {parseDockerCommand(entry.created_by)}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>容器配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 max-h-100 min-h-20 overflow-auto">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      入口点 (Entrypoint)
                    </h4>
                    <div className="bg-muted rounded-md p-3">
                      <code className="text-sm overflow-auto">
                        {imageInfo.config.config?.Entrypoint?.join(' ') || '(未设置)'}
                      </code>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Terminal className="h-4 w-4 overflow-auto" />
                      命令 (Cmd)
                    </h4>
                    <div className="bg-muted rounded-md p-3">
                      <code className="text-sm">
                        {imageInfo.config.config?.Cmd?.join(' ') || '(未设置)'}
                      </code>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">工作目录</h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {imageInfo.config.config?.WorkingDir || '/'}
                  </code>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">用户</h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {imageInfo.config.config?.User || 'root'}
                  </code>
                </div>

                {imageInfo.config.config?.ExposedPorts && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">暴露端口</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(imageInfo.config.config.ExposedPorts).map((port) => (
                        <Badge key={port} variant="outline">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="env" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>环境变量</CardTitle>
                <CardDescription>
                  共 {imageInfo.config.config?.Env?.length || 0} 个环境变量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-100 min-h-20 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>变量名</TableHead>
                        <TableHead>值</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imageInfo.config.config?.Env?.map((env, index) => {
                        const [key, ...valueParts] = env.split('=')
                        const value = valueParts.join('=')
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm font-medium">
                              {key}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground break-all">
                              {value}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>镜像标签</CardTitle>
                <CardDescription>
                  共 {Object.keys(imageInfo.config.config?.Labels || {}).length} 个标签
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-100 min-h-20 overflow-auto">
                  {imageInfo.config.config?.Labels &&
                  Object.keys(imageInfo.config.config.Labels).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>标签名</TableHead>
                          <TableHead>值</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(imageInfo.config.config.Labels).map(
                          ([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-mono text-sm font-medium">
                                {key}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground break-all">
                                {value}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">
                      没有设置标签
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
