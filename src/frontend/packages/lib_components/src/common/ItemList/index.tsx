import { colorsTokens } from 'lib-common';
import React from 'react';

import { Box, Text } from '@lib-components/common/';

interface ItemListProps<T> {
  children: (item: T, index: string) => React.ReactNode;
  itemList: T[];
  noItemsMessage: string;
}

export const ItemList = <T,>({
  children,
  itemList,
  noItemsMessage,
}: ItemListProps<T>) => {
  return (
    <Box gap="small">
      <Box
        background={colorsTokens['info-150']}
        style={{ border: `solid ${colorsTokens['info-200']} 2px` }}
        round="xsmall"
      >
        <Box align="center" justify="center" pad="small">
          {itemList.length ? (
            itemList.map((item, index) => (
              <Box
                key={`list_item_${index}`}
                fill
                style={{
                  borderTop: index && `dashed ${colorsTokens['info-200']} 2px`,
                }}
                pad={{
                  top: index ? 'small' : 'none',
                  bottom: index !== itemList.length - 1 ? 'small' : 'none',
                }}
              >
                {children(item, `list_item_${index}`)}
              </Box>
            ))
          ) : (
            <Text>{noItemsMessage}</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};
