import {ModeToggle} from '@/components/mode-toggle';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {type Registry, registryApi} from '@/lib/api';
import {useAuthStore} from '@/store/auth';
import {useRegistryStore} from '@/store/registry';
import {useQuery} from '@tanstack/react-query';
import {ChevronDown, Container, Database, LogOut, Settings, User} from 'lucide-react';
import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {toast} from 'sonner';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const {activeRegistry, setActiveRegistry} = useRegistryStore();
  const {user, logout} = useAuthStore();

  // 根据当前路径确定当前视图
  const currentView = location.pathname === '/registries' ? 'registries' : 'images';

  const {data: registries} = useQuery({
    queryKey: ['registries'],
    queryFn: () => registryApi.getAll().then(res => res.data),
  });

  // 初始化时加载活跃的 registry
  useEffect(() => {
    const loadActiveRegistry = async () => {
      try {
        const res = await registryApi.getActive();
        setActiveRegistry(res.data);
      } catch {
        // 没有活跃的 registry
        setActiveRegistry(null);
      }
    };
    loadActiveRegistry().then();
  }, [setActiveRegistry]);

  const handleRegistryChange = async (registry: Registry) => {
    try {
      const res = await registryApi.activate(registry.id);
      setActiveRegistry(res.data);
      window.location.href = window.location.origin
    } catch (error) {
      console.error('切换 registry 失败:', error);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 gap-6">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="logo" className="size-8"/>
          <span className="font-bold text-xl hidden sm:block">DGUI</span>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant={currentView === 'images' ? 'secondary' : 'ghost'}
            size="sm" className="flex items-center gap-2"
            onClick={() => navigate('/images')}
          >
            <Database className="size-4"/>
            <span className="hidden sm:block">镜像仓库</span>
          </Button>
          <Button
            variant={currentView === 'registries' ? 'secondary' : 'ghost'}
            size="sm" className="flex items-center gap-2"
            onClick={() => navigate('/registries')}
          >
            <Settings className="size-4"/>
            <span className="hidden sm:block">Registry 管理</span>
          </Button>
        </nav>

        <div className="flex-1"/>

        <div className="flex items-center gap-2">
          <ModeToggle/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Container className="h-4 w-4"/>
                {activeRegistry ? (
                  <span className="max-w-20 sm:max-w-50 truncate">{activeRegistry.name}</span>
                ) : (
                  <span className="max-w-20 sm:max-w-50 truncate text-muted-foreground">未选择 Registry</span>
                )}
                <ChevronDown className="h-4 w-4"/>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 sm:w-50">
              {registries?.length === 0 ? (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">没有配置 Registry</span>
                </DropdownMenuItem>
              ) : (
                registries?.map((registry: Registry) => (
                  <DropdownMenuItem
                    key={registry.id}
                    onClick={() => handleRegistryChange(registry)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{registry.name}</span>
                    {registry.is_active && (
                      <Badge variant="secondary" className="ml-2">
                        当前
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="size-4"/>
                <span className="hidden sm:block">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <User className="h-4 w-4 mr-2"/>
                {user?.username}
                {user?.is_admin && (
                  <Badge variant="secondary" className="ml-2">管理员</Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2"/>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
