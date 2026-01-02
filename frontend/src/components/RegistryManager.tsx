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
} from '@/components/ui/alert-dialog';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip.tsx';

import {type Registry, registryApi, type RegistryCreate} from '@/lib/api';
import {cn} from '@/lib/utils.ts';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {BugPlay, Check, ExternalLink, Pencil, Plus, RefreshCw, Trash2} from 'lucide-react';
import {type FormEvent, useState} from 'react';
import {toast} from 'sonner';

export function RegistryManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRegistry, setEditingRegistry] = useState<Registry | null>(null);
  const [formData, setFormData] = useState<RegistryCreate>({
    name: '',
    url: '',
    username: '',
    password: '',
  });
  const [editFormData, setEditFormData] = useState<RegistryCreate>({
    name: '',
    url: '',
    username: '',
    password: '',
  });

  const {data: registries, isLoading, refetch} = useQuery({
    queryKey: ['registries'],
    queryFn: () => registryApi.getAll().then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: RegistryCreate) => registryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['registries']}).then();
      setDialogOpen(false);
      setFormData({name: '', url: '', username: '', password: ''});
      toast.success('Registry 创建成功');
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => registryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['registries']}).then();
      toast.success('Registry 删除成功');
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => registryApi.testConnection(id),
    onSuccess: (res) => {
      if (res.data.connected) {
        toast.success('连接成功');
      } else {
        toast.error(`连接失败: ${res.data.error}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`测试失败: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({id, data}: {id: number; data: Partial<RegistryCreate>}) => registryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['registries']}).then();
      setEditDialogOpen(false);
      setEditingRegistry(null);
      setEditFormData({name: '', url: '', username: '', password: ''});
      toast.success('Registry 更新成功');
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingRegistry) {
      updateMutation.mutate({id: editingRegistry.id, data: editFormData});
    }
  };

  const openEditDialog = (registry: Registry) => {
    setEditingRegistry(registry);
    setEditFormData({
      name: registry.name,
      url: registry.url,
      username: registry.username || '',
      password: '',
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registry 管理</h2>
          <p className="text-muted-foreground">
            配置和管理多个 Docker Registry 仓库
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4"/>
            <span className="hidden sm:block">刷新</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4"/>
                <span className="hidden sm:block">添加 Registry</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新的 Registry</DialogTitle>
                <DialogDescription>
                  配置 Docker Registry 连接信息
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">名称</Label>
                    <Input
                      id="name"
                      placeholder="My Registry"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      placeholder="http://localhost:5000"
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">用户名 (可选)</Label>
                    <Input
                      id="username"
                      placeholder="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">密码 (可选)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? '创建中...' : '创建'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">加载中...</div>
      ) : registries?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">还没有配置任何 Registry</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2"/>
              添加第一个 Registry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {registries?.map((registry: Registry) => (
            <Card key={registry.id} className={cn(' min-w-0 gap-2', registry.is_active ? 'border-primary' : '')}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {registry.name}
                    {registry.is_active && (
                      <Badge variant="default" className="ml-2">
                        <Check className="h-3 w-3 mr-1"/>
                        当前
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 ">
                  <ExternalLink className="size-4"/>
                  <Tooltip>
                    <TooltipTrigger className="flex-1 min-w-0 text-left truncate font-mono text-xs">
                      {registry.url}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">
                        {registry.url}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(registry.id)}
                    disabled={testMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <BugPlay className="size-4"/>
                    <span className="hidden sm:block">测试</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(registry)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="size-4"/>
                    <span className="hidden sm:block">编辑</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4"/>
                        <span className="hidden sm:block">删除</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除 Registry "{registry.name}" 吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(registry.id)}
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 编辑 Registry 对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑 Registry</DialogTitle>
            <DialogDescription>
              修改 Docker Registry 连接信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">名称</Label>
                <Input
                  id="edit-name"
                  placeholder="My Registry"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  placeholder="http://localhost:5000"
                  value={editFormData.url}
                  onChange={(e) => setEditFormData({...editFormData, url: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">用户名 (可选)</Label>
                <Input
                  id="edit-username"
                  placeholder="username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">密码 (可选，留空则不修改)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="留空则保持原密码"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
