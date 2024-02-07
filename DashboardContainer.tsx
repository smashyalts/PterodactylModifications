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
import { useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export default () => {
  const [allowDragDrop, setAllowDragDrop] = useState(true);
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

  const [serversOrder, setServersOrder] = useState<string[]>([]);

  useEffect(() => {
    const loadServersOrder = () => {
      const savedOrder = localStorage.getItem(`serversOrder:${uuid}`);
      console.log('Loaded order from localStorage:', savedOrder);
      setServersOrder(savedOrder ? JSON.parse(savedOrder) : []);
    };

    loadServersOrder();
  }, [uuid]);

  useEffect(() => {
    if (!servers) return;
    const newOrder = servers.items.map((server) => server.uuid);
    
    if (!localStorage.getItem(`serversOrder:${uuid}`) || newOrder.length !== serversOrder.length) {
      setServersOrder(newOrder);
      localStorage.setItem(`serversOrder:${uuid}`, JSON.stringify(newOrder));
    }
  }, [servers, uuid]);

  useEffect(() => {
    console.log('Saving servers order to localStorage');
    localStorage.setItem(`serversOrder:${uuid}`, JSON.stringify(serversOrder));
  }, [serversOrder]);

  const onDragEnd = (result: DropResult ) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const newOrder = Array.from(serversOrder);
    newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, serversOrder[source.index]);

    setServersOrder(newOrder);
    localStorage.setItem(`serversOrder:${uuid}`, JSON.stringify(newOrder));
  };

  return (
    <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
      {rootAdmin && (
        <div css={tw`mb-2 flex justify-end items-center`}>
          <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
            {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
          </p>
<Switch name={'show_all_servers'} defaultChecked={showOnlyAdmin} onChange={() => setShowOnlyAdmin(s => !s)} />
        </div>
      )}
      <div css={tw`mb-2 flex justify-end items-center`}>
        <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
          {allowDragDrop ? "Sorting Mode Disabled" : 'Sorting Mode Enabled'}
        </p>
        <Switch
          name={'allow_drag_drop'}
          defaultChecked={!allowDragDrop}
          onChange={() => setAllowDragDrop(!allowDragDrop)}
        />
      </div>
      {!servers ? (
        <Spinner centered size={'large'} />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='servers'>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {serversOrder.map((serverUuid, index) => {
                  const server = servers.items.find((s) => s.uuid === serverUuid);
                  if (!server) {
                    console.warn(`Server with uuid ${serverUuid} not found`);
                    return null;
                  }
                  return (
                    <Draggable key={server.uuid} draggableId={server.uuid} index={index} isDragDisabled={allowDragDrop}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ServerRow server={server} css={index > 0 ? tw`mt-2` : undefined} />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </PageContentBlock>
  );
};
