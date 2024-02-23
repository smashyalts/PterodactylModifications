import React, { useState, useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { NavLink, useLocation } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import style from './style.module.css';

const FilesPerPage = 250; 

const sortFiles = (files: FileObject[]): FileObject[] => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const sortedFiles: FileObject[] = files
        .sort((a, b) => collator.compare(a.name, b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    const filteredFiles = files?.filter(file => file.name.includes(searchTerm));
    const sortedFiles = filteredFiles ? sortFiles(filteredFiles) : [];
    
    const totalPages = sortedFiles ? Math.ceil(sortedFiles.length / FilesPerPage) : 0;
    const [currentPage, setCurrentPage] = useState(1);
    
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };
    
    const paginatedFiles = sortedFiles
        ? sortedFiles.slice((currentPage - 1) * FilesPerPage, currentPage * FilesPerPage)
        : [];

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                    <FileManagerBreadcrumbs
                        renderLeft={
                            <FileActionCheckbox
                                type={'checkbox'}
                                css={tw`mx-4`}
                                checked={selectedFilesLength === (filteredFiles?.length === 0 ? -1 : filteredFiles?.length)}
                                onChange={onSelectAllClick}
                            />
                        }
                    />
<div className="search-input-container" style={{ marginLeft: '0.5rem', marginRight: '1rem' }}>
                                        <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            padding: '0.25rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            width: '125px',
                            height: '30px',
                        }}
                    /> 
                    </div>
                    <Can action={'file.create'}>
                        <div className={style.manager_actions}>
                            <FileManagerStatus />
                            <NewDirectoryButton />
                            <UploadButton />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <Button>New File</Button>
                            </NavLink>
                        </div>
                    </Can>
                </div>
            </ErrorBoundary>
            {!filteredFiles ? (
                <Spinner size={'large'} centered />
            ) : (
                <>
                    {!filteredFiles.length ? (
                        <p css={tw`text-sm text-neutral-400 text-center`}>This directory seems to be empty.</p>
                    ) : (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div>
                                {filteredFiles.length > FilesPerPage && (
                                    <div css={tw`mb-4`}>
                                        <PaginationControls
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                        />
                                    </div>
                                )}
                                {paginatedFiles.map((file) => (
                                    <FileObjectRow key={file.key} file={file} />
                                ))}
                                {filteredFiles.length > FilesPerPage && (
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                )}
                                <MassActionsBar />
                            </div>
                        </CSSTransition>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};


const PaginationControls: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
    <div css={tw`flex justify-center my-4`}>
        <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            css={tw`px-4 py-2 bg-gray-500 text-white rounded-l`}
        >
            Previous
        </button>
        <span css={tw`px-4 py-2 bg-gray-200 text-gray-800`}>
            Page {currentPage} of {totalPages}
        </span>
        <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            css={tw`px-4 py-2 bg-gray-500 text-white rounded-r`}
        >
            Next
        </button>
    </div>
);
