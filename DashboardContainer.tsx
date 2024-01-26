import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const Folder = ({ folderName, servers, onDrop }: any) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: 'SERVER',
    drop: (item: any) => onDrop(item.uuid, folderName),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div>
      <div ref={dropRef}>
        <p>{folderName}</p>
        {isOver && <div style={{ height: '10px', background: 'yellow' }}></div>}
      </div>
      {servers.map((server: any) => (
        <div key={server.uuid} style={{ margin: '5px' }}>
          <p>{server.name}</p>
          {server.folder && <p>Folder: {server.folder}</p>}
        </div>
      ))}
    </div>
  );
};

const ServerDraggable = ({ server }: { server: Server }) => {
  const [, dragRef] = useDrag({
    type: 'SERVER',
    item: { uuid: server.uuid },
  });

  return (
    <div ref={dragRef}>
      <p>{server.name}</p>
      {server.folder && <p>Folder: {server.folder}</p>}
    </div>
  );
};

export default () => {
  const { search } = useLocation();
  const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

  const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
  const { clearFlashes, clearAndAddHttpError } = useFlash();
  const uuid = useStoreState((state) => state.user.data!.uuid);
  const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
  const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

  const { data: servers, error } = useSWR<PaginatedResult<Server>>(
    ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
    () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
  );

  const [folders, setFolders] = useState<Record<string, Server[]>>({});

  const [newFolderName, setNewFolderName] = useState('');

const toggleFolderVisibility = (folderName: string) => {
 setFolders((prevFolders) => {
    const updatedFolders: Record<string, Server[]> = { ...prevFolders };

    if (updatedFolders[folderName]) {
      updatedFolders[folderName] = updatedFolders[folderName].length === 0 ? [] : [];
    } else {
      updatedFolders[folderName] = [];
    }

    return updatedFolders;
 });
};

  const handleDrop = (serverUuid: string, folderName: string) => {
    console.log(`Server ${serverUuid} dropped into folder ${folderName}`);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() !== '') {
      setFolders((prevFolders) => ({
        ...prevFolders,
        [newFolderName]: [],
      }));
      setNewFolderName('');
    }
  };

  useEffect(() => {
    if (!servers) return;
    if (servers.pagination.currentPage > 1 && !servers.items.length) {
      setPage(1);
    }
  }, [servers?.pagination.currentPage]);

  useEffect(() => {

    window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
  }, [page]);

  useEffect(() => {
    if (error) clearAndAddHttpError({ key: 'dashboard', error });
    if (!error) clearFlashes('dashboard');
  }, [error]);

  return (
    <DndProvider backend={HTML5Backend}>
      <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
        {rootAdmin && (
          <div css={tw`mb-2 flex justify-end items-center`}>
            <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
              {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
            </p>
            <Switch
              name={'show_all_servers'}
              defaultChecked={showOnlyAdmin}
              onChange={() => setShowOnlyAdmin((s) => !s)}
            />
          </div>
        )}

        <div css={tw`mb-2 flex items-center`}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name"
            css={tw`mr-2 p-2 border border-neutral-300 rounded`}
          />
          <button onClick={handleCreateFolder} css={tw`px-4 py-2 bg-green-500 text-white rounded`}>
            Create Folder
          </button>
        </div>

        {!servers ? (
          <Spinner centered size={'large'} />
        ) : (
          <div>
            {Object.entries(folders).map(([folderName, folderServers]) => (
              <Folder
                key={folderName}
                folderName={folderName}
                servers={folderServers}
                onDrop={handleDrop}
              />
            ))}
            {servers.items.map((server, index) => (
              <ServerDraggable key={server.uuid} server={server} css={index > 0 ? tw`mt-2` : undefined} />
            ))}
          </div>
        )}
      </PageContentBlock>
    </DndProvider>
  );
};
