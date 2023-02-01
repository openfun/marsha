/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  actionOne,
  createOne,
  fetchOne,
  updateOne,
  MarkdownDocument,
  MarkdownSaveTranslationsRequest,
  MarkdownSaveTranslationsResponse,
} from 'lib-components';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from 'react-query';

interface MarkdownDocumentsSelectResponse {
  new_url: string;
  markdown_documents: MarkdownDocument[];
}
export const useSelectMarkdownDocument = (
  queryConfig?: UseQueryOptions<
    MarkdownDocumentsSelectResponse,
    'markdown-documents',
    MarkdownDocumentsSelectResponse
  >,
) => {
  const key = ['markdown-documents', 'lti-select'];
  return useQuery<MarkdownDocumentsSelectResponse, 'markdown-documents'>(
    key,
    fetchOne,
    queryConfig,
  );
};

export const useMarkdownDocument = (
  documentId: string,
  queryConfig?: UseQueryOptions<
    MarkdownDocument,
    'markdown-documents',
    MarkdownDocument
  >,
) => {
  const key = ['markdown-documents', documentId];
  return useQuery<MarkdownDocument, 'markdown-documents'>(
    key,
    fetchOne,
    queryConfig,
  );
};

type UseCreateMarkdownDocumentData = {
  playlist: string;
  title: string;
  description?: string;
  lti_id?: string;
};
type UseCreateMarkdownDocumentError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseCreateMarkdownDocumentData]?: string[] }[];
    };
type UseCreateMarkdownDocumentOptions = UseMutationOptions<
  MarkdownDocument,
  UseCreateMarkdownDocumentError,
  UseCreateMarkdownDocumentData
>;
export const useCreateMarkdownDocument = (
  options?: UseCreateMarkdownDocumentOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    MarkdownDocument,
    UseCreateMarkdownDocumentError,
    UseCreateMarkdownDocumentData
  >(
    (newMarkdownDocument) =>
      createOne({ name: 'markdown-documents', object: newMarkdownDocument }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('markdown-documents');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
    },
  );
};

type UseUpdateMarkdownDocumentData = Partial<
  Omit<MarkdownDocument, 'portable_to'> & { portable_to: string[] }
>;
type UseUpdateMarkdownDocumentError =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: { [key in keyof UseUpdateMarkdownDocumentData]?: string[] }[];
    };
type UseUpdateMarkdownDocumentOptions = UseMutationOptions<
  MarkdownDocument,
  UseUpdateMarkdownDocumentError,
  UseUpdateMarkdownDocumentData
>;
export const useUpdateMarkdownDocument = (
  id: string,
  options?: UseUpdateMarkdownDocumentOptions,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    MarkdownDocument,
    UseUpdateMarkdownDocumentError,
    UseUpdateMarkdownDocumentData
  >(
    (updatedMarkdownDocument) =>
      updateOne({
        name: 'markdown-documents',
        id,
        object: updatedMarkdownDocument,
      }),
    {
      ...options,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries('markdown-documents');
        if (options?.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries('markdown-documents');
        if (options?.onError) {
          options.onError(error, variables, context);
        }
      },
    },
  );
};

type MutationMarkdownData<MarkdownRequest> = Partial<MarkdownRequest>;
type MutationMarkdownError<MarkdownRequest> =
  | { code: 'exception' }
  | {
      code: 'invalid';
      errors: {
        [key in keyof MutationMarkdownData<MarkdownRequest>]?: string[];
      }[];
    };
type MutationMarkdownOptions<MarkdownResponse, MarkdownRequest> =
  UseMutationOptions<
    MarkdownResponse,
    MutationMarkdownError<MarkdownRequest>,
    MutationMarkdownData<MarkdownRequest>
  >;
enum MutationMarkdownAction {
  SAVE_TRANSLATIONS = 'save-translations',
}
const markdownDocumentActionMutation =
  <MarkdownResponse, MarkdownRequest>(action: MutationMarkdownAction) =>
  (
    id: string,
    options?: MutationMarkdownOptions<MarkdownResponse, MarkdownRequest>,
    doNotInvalidateQueries?: boolean,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<
      MarkdownResponse,
      MutationMarkdownError<MarkdownRequest>,
      MutationMarkdownData<MarkdownRequest>
    >(
      (object) =>
        actionOne({
          name: 'markdown-documents',
          id,
          action,
          object,
        }),
      {
        ...options,
        onSuccess: (data, variables, context) => {
          if (!doNotInvalidateQueries) {
            queryClient.invalidateQueries('markdown-documents');
          }
          if (options?.onSuccess) {
            options.onSuccess(data, variables, context);
          }
        },
        onError: (error, variables, context) => {
          if (!doNotInvalidateQueries) {
            queryClient.invalidateQueries('markdown-documents');
          }
          if (options?.onError) {
            options.onError(error, variables, context);
          }
        },
      },
    );
  };
export const useSaveTranslations = markdownDocumentActionMutation<
  MarkdownSaveTranslationsResponse,
  MarkdownSaveTranslationsRequest
>(MutationMarkdownAction.SAVE_TRANSLATIONS);

// Don't use the ActionMutation here because it has to be called outside hook context
export const markdownRenderLatex = (
  id: string,
  rawLatexContent: string,
): any => {
  return actionOne({
    name: 'markdown-documents',
    id,
    action: 'latex-rendering',
    method: 'POST',
    object: { text: rawLatexContent },
  });
};

// It has to be called outside hook context
export const fetchOneMarkdownImage = (markdownImageId: string): any => {
  return fetchOne({
    meta: undefined,
    pageParam: undefined,
    queryKey: ['markdown-images', markdownImageId],
  });
};
