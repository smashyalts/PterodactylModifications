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
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

export default () => {
  const [allowDragDrop, setAllowDragDrop] = useState(true);
  const { search } = useLocation();
  const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

  const [page, setPage] = useState(
    !isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1
  );
  const { clearFlashes, clearAndAddHttpError } = useFlash();
  const uuid = useStoreState((state) => state.user.data!.uuid);
  const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
  const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(
    `${uuid}:show_all_servers`,
    false
  );

  const [isOrderLoaded, setIsOrderLoaded] = useState(false);

  const { data: servers, error, isValidating: isLoadingServers } = useSWR<PaginatedResult<Server>>(
    ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
    () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    // Removed the incompatible config object
  );

  useEffect(() => {
    if (!servers) return;
    // Prevent page reset if data is just stale during validation
    if (!isLoadingServers && servers.pagination.currentPage > 1 && !servers.items.length) {
      setPage(1);
    }
  }, [servers?.pagination.currentPage, servers?.items.length, isLoadingServers]);

  useEffect(() => {
    window.history.replaceState(
      null,
      document.title,
      `/${page <= 1 ? '' : `?page=${page}`}`
    );
  }, [page]);

  useEffect(() => {
    if (error) clearAndAddHttpError({ key: 'dashboard', error });
    if (!error) clearFlashes('dashboard');
  }, [error]);

  const [adminServersOrder, setAdminServersOrder] = useState<string[]>([]);
  const [nonAdminServersOrder, setNonAdminServersOrder] = useState<string[]>([]);

  useEffect(() => {
    let loadedAdmin = false;
    let loadedNonAdmin = false;
    try {
      const adminSavedOrder = localStorage.getItem(`admin:serversOrder:${uuid}`);
      if (adminSavedOrder && adminSavedOrder !== '[]') {
        setAdminServersOrder(JSON.parse(adminSavedOrder));
      }
      loadedAdmin = true;
    } catch (e) {
      console.error('Error parsing admin server order from localStorage', e);
      localStorage.removeItem(`admin:serversOrder:${uuid}`);
    }

    try {
      const nonAdminSavedOrder = localStorage.getItem(`nonadmin:serversOrder:${uuid}`);
      if (nonAdminSavedOrder && nonAdminSavedOrder !== '[]') {
        setNonAdminServersOrder(JSON.parse(nonAdminSavedOrder));
      }
      loadedNonAdmin = true;
    } catch (e) {
      console.error('Error parsing non-admin server order from localStorage', e);
      localStorage.removeItem(`nonadmin:serversOrder:${uuid}`);
    }

    if(loadedAdmin && loadedNonAdmin) {
        setIsOrderLoaded(true);
    }
  }, [uuid]);

  useEffect(() => {
    if (!isOrderLoaded || !servers?.items) {
      return;
    }

    const isShowingAdmin = showOnlyAdmin && rootAdmin;
    const currentOrderState = isShowingAdmin
      ? adminServersOrder
      : nonAdminServersOrder;
    const setOrderState = isShowingAdmin
      ? setAdminServersOrder
      : setNonAdminServersOrder;

    const fetchedServerUuids = servers.items.map((s) => s.uuid);
    const fetchedServerUuidSet = new Set(fetchedServerUuids);

    if (currentOrderState.length === 0 && fetchedServerUuids.length > 0) {
      setOrderState(fetchedServerUuids);
      return;
    }

    const filteredOrder = currentOrderState.filter((uuid) =>
      fetchedServerUuidSet.has(uuid)
    );
    const existingInFilteredOrderSet = new Set(filteredOrder);
    const newServers = fetchedServerUuids.filter(
      (uuid) => !existingInFilteredOrderSet.has(uuid)
    );
    const reconciledOrder = [...filteredOrder, ...newServers];

    if (JSON.stringify(reconciledOrder) !== JSON.stringify(currentOrderState)) {
      setOrderState(reconciledOrder);
    }

  }, [
    servers,
    isOrderLoaded,
    uuid,
    showOnlyAdmin,
    rootAdmin,
    adminServersOrder,
    nonAdminServersOrder,
  ]);

  useEffect(() => {
    if (!isOrderLoaded) {
        return;
    }

    const adminKey = `admin:serversOrder:${uuid}`;
    const nonAdminKey = `nonadmin:serversOrder:${uuid}`;

    try {
        const currentAdminOrder = JSON.stringify(adminServersOrder);
        localStorage.setItem(adminKey, currentAdminOrder);
    } catch (e) {
        console.error("Error saving admin order to localStorage", e);
    }

    try {
        const currentNonAdminOrder = JSON.stringify(nonAdminServersOrder);
        localStorage.setItem(nonAdminKey, currentNonAdminOrder);
    } catch (e) {
        console.error("Error saving non-admin order to localStorage", e);
    }

  }, [adminServersOrder, nonAdminServersOrder, uuid, isOrderLoaded]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const isShowingAdmin = showOnlyAdmin && rootAdmin;
    const currentOrder = isShowingAdmin
      ? adminServersOrder
      : nonAdminServersOrder;
    const setOrder = isShowingAdmin
      ? setAdminServersOrder
      : setNonAdminServersOrder;

    const newOrder = Array.from(currentOrder);
    const [reorderedItem] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, reorderedItem);

    setOrder(newOrder);
  };

  const serversOrder = showOnlyAdmin && rootAdmin ? adminServersOrder : nonAdminServersOrder;
  // Use isValidating for loading state, but only show spinner if data isn't already present
  const showSpinner = (!servers && isLoadingServers) || !isOrderLoaded;

  return (
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
      <div css={tw`mb-2 flex justify-end items-center`}>
        <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
          {allowDragDrop ? 'Sorting Mode Disabled' : 'Sorting Mode Enabled'}
        </p>
        <Switch
          name={'allow_drag_drop'}
          defaultChecked={!allowDragDrop}
          onChange={() => setAllowDragDrop(!allowDragDrop)}
        />
      </div>
      {showSpinner ? (
        <Spinner centered size={'large'} />
      ) : !servers?.items && !isLoadingServers ? ( // Check isLoadingServers again here to avoid showing "No servers" during revalidation
         <p>No servers found.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='servers'>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {serversOrder.length > 0 && servers?.items ? ( // Ensure servers.items exists before mapping
                    serversOrder.map((serverUuid, index) => {
                    // Find server using the fetched data (servers.items)
                    const server = servers.items.find((s) => s.uuid === serverUuid);
                    if (!server) {
                        console.warn(
                        `Server with uuid ${serverUuid} found in order but not in current fetched items.`
                        );
                        return null;
                    }
                    return (
                        <Draggable
                        key={server.uuid}
                        draggableId={server.uuid}
                        index={index}
                        isDragDisabled={allowDragDrop}
                        >
                        {(provided) => (
                            <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            >
                            <ServerRow
                                server={server}
                                css={index > 0 ? tw`mt-2` : undefined}
                            />
                            </div>
                        )}
                        </Draggable>
                    );
                    })
                ) : (
                    <p>No servers to display in the current view.</p>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </PageContentBlock>
  );
};
