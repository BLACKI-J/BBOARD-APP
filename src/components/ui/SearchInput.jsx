import React from 'react';
import { Search } from 'lucide-react';

/**
 * SearchInput — standardized search bar with icon.
 */
export const SearchInput = ({
    value,
    onChange,
    placeholder = 'Rechercher...',
    style = {},
    inputStyle = {},
    ...rest
}) => {
    return (
        <div style={{ position: 'relative', flex: 1, ...style }}>
            <Search
                size={18}
                style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                }}
            />
            <input
                className="glass-input"
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ paddingLeft: '48px', height: '48px', borderRadius: '14px', ...inputStyle }}
                {...rest}
            />
        </div>
    );
};

export default SearchInput;
