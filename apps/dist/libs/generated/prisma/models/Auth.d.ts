import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type AuthModel = runtime.Types.Result.DefaultSelection<Prisma.$AuthPayload>;
export type AggregateAuth = {
    _count: AuthCountAggregateOutputType | null;
    _avg: AuthAvgAggregateOutputType | null;
    _sum: AuthSumAggregateOutputType | null;
    _min: AuthMinAggregateOutputType | null;
    _max: AuthMaxAggregateOutputType | null;
};
export type AuthAvgAggregateOutputType = {
    id: number | null;
};
export type AuthSumAggregateOutputType = {
    id: number | null;
};
export type AuthMinAggregateOutputType = {
    id: number | null;
    name: string | null;
    email: string | null;
    passwordHash: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AuthMaxAggregateOutputType = {
    id: number | null;
    name: string | null;
    email: string | null;
    passwordHash: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type AuthCountAggregateOutputType = {
    id: number;
    name: number;
    email: number;
    passwordHash: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type AuthAvgAggregateInputType = {
    id?: true;
};
export type AuthSumAggregateInputType = {
    id?: true;
};
export type AuthMinAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    passwordHash?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AuthMaxAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    passwordHash?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type AuthCountAggregateInputType = {
    id?: true;
    name?: true;
    email?: true;
    passwordHash?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type AuthAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuthWhereInput;
    orderBy?: Prisma.AuthOrderByWithRelationInput | Prisma.AuthOrderByWithRelationInput[];
    cursor?: Prisma.AuthWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | AuthCountAggregateInputType;
    _avg?: AuthAvgAggregateInputType;
    _sum?: AuthSumAggregateInputType;
    _min?: AuthMinAggregateInputType;
    _max?: AuthMaxAggregateInputType;
};
export type GetAuthAggregateType<T extends AuthAggregateArgs> = {
    [P in keyof T & keyof AggregateAuth]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAuth[P]> : Prisma.GetScalarType<T[P], AggregateAuth[P]>;
};
export type AuthGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuthWhereInput;
    orderBy?: Prisma.AuthOrderByWithAggregationInput | Prisma.AuthOrderByWithAggregationInput[];
    by: Prisma.AuthScalarFieldEnum[] | Prisma.AuthScalarFieldEnum;
    having?: Prisma.AuthScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AuthCountAggregateInputType | true;
    _avg?: AuthAvgAggregateInputType;
    _sum?: AuthSumAggregateInputType;
    _min?: AuthMinAggregateInputType;
    _max?: AuthMaxAggregateInputType;
};
export type AuthGroupByOutputType = {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    _count: AuthCountAggregateOutputType | null;
    _avg: AuthAvgAggregateOutputType | null;
    _sum: AuthSumAggregateOutputType | null;
    _min: AuthMinAggregateOutputType | null;
    _max: AuthMaxAggregateOutputType | null;
};
export type GetAuthGroupByPayload<T extends AuthGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AuthGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AuthGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AuthGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AuthGroupByOutputType[P]>;
}>>;
export type AuthWhereInput = {
    AND?: Prisma.AuthWhereInput | Prisma.AuthWhereInput[];
    OR?: Prisma.AuthWhereInput[];
    NOT?: Prisma.AuthWhereInput | Prisma.AuthWhereInput[];
    id?: Prisma.IntFilter<"Auth"> | number;
    name?: Prisma.StringFilter<"Auth"> | string;
    email?: Prisma.StringFilter<"Auth"> | string;
    passwordHash?: Prisma.StringFilter<"Auth"> | string;
    createdAt?: Prisma.DateTimeFilter<"Auth"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Auth"> | Date | string;
};
export type AuthOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    email?: string;
    AND?: Prisma.AuthWhereInput | Prisma.AuthWhereInput[];
    OR?: Prisma.AuthWhereInput[];
    NOT?: Prisma.AuthWhereInput | Prisma.AuthWhereInput[];
    name?: Prisma.StringFilter<"Auth"> | string;
    passwordHash?: Prisma.StringFilter<"Auth"> | string;
    createdAt?: Prisma.DateTimeFilter<"Auth"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Auth"> | Date | string;
}, "id" | "email">;
export type AuthOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.AuthCountOrderByAggregateInput;
    _avg?: Prisma.AuthAvgOrderByAggregateInput;
    _max?: Prisma.AuthMaxOrderByAggregateInput;
    _min?: Prisma.AuthMinOrderByAggregateInput;
    _sum?: Prisma.AuthSumOrderByAggregateInput;
};
export type AuthScalarWhereWithAggregatesInput = {
    AND?: Prisma.AuthScalarWhereWithAggregatesInput | Prisma.AuthScalarWhereWithAggregatesInput[];
    OR?: Prisma.AuthScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AuthScalarWhereWithAggregatesInput | Prisma.AuthScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"Auth"> | number;
    name?: Prisma.StringWithAggregatesFilter<"Auth"> | string;
    email?: Prisma.StringWithAggregatesFilter<"Auth"> | string;
    passwordHash?: Prisma.StringWithAggregatesFilter<"Auth"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Auth"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Auth"> | Date | string;
};
export type AuthCreateInput = {
    name: string;
    email: string;
    passwordHash: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthUncheckedCreateInput = {
    id?: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthUpdateInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    passwordHash?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    passwordHash?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthCreateManyInput = {
    id?: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type AuthUpdateManyMutationInput = {
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    passwordHash?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    passwordHash?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AuthCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type AuthMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    passwordHash?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type AuthSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
};
export type AuthSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    passwordHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["auth"]>;
export type AuthSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    passwordHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["auth"]>;
export type AuthSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    email?: boolean;
    passwordHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["auth"]>;
export type AuthSelectScalar = {
    id?: boolean;
    name?: boolean;
    email?: boolean;
    passwordHash?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type AuthOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "email" | "passwordHash" | "createdAt" | "updatedAt", ExtArgs["result"]["auth"]>;
export type $AuthPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Auth";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        name: string;
        email: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["auth"]>;
    composites: {};
};
export type AuthGetPayload<S extends boolean | null | undefined | AuthDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AuthPayload, S>;
export type AuthCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AuthFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AuthCountAggregateInputType | true;
};
export interface AuthDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Auth'];
        meta: {
            name: 'Auth';
        };
    };
    findUnique<T extends AuthFindUniqueArgs>(args: Prisma.SelectSubset<T, AuthFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends AuthFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AuthFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends AuthFindFirstArgs>(args?: Prisma.SelectSubset<T, AuthFindFirstArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends AuthFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AuthFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends AuthFindManyArgs>(args?: Prisma.SelectSubset<T, AuthFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends AuthCreateArgs>(args: Prisma.SelectSubset<T, AuthCreateArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends AuthCreateManyArgs>(args?: Prisma.SelectSubset<T, AuthCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends AuthCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AuthCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends AuthDeleteArgs>(args: Prisma.SelectSubset<T, AuthDeleteArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends AuthUpdateArgs>(args: Prisma.SelectSubset<T, AuthUpdateArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends AuthDeleteManyArgs>(args?: Prisma.SelectSubset<T, AuthDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends AuthUpdateManyArgs>(args: Prisma.SelectSubset<T, AuthUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends AuthUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AuthUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends AuthUpsertArgs>(args: Prisma.SelectSubset<T, AuthUpsertArgs<ExtArgs>>): Prisma.Prisma__AuthClient<runtime.Types.Result.GetResult<Prisma.$AuthPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends AuthCountArgs>(args?: Prisma.Subset<T, AuthCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AuthCountAggregateOutputType> : number>;
    aggregate<T extends AuthAggregateArgs>(args: Prisma.Subset<T, AuthAggregateArgs>): Prisma.PrismaPromise<GetAuthAggregateType<T>>;
    groupBy<T extends AuthGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AuthGroupByArgs['orderBy'];
    } : {
        orderBy?: AuthGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AuthGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuthGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: AuthFieldRefs;
}
export interface Prisma__AuthClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface AuthFieldRefs {
    readonly id: Prisma.FieldRef<"Auth", 'Int'>;
    readonly name: Prisma.FieldRef<"Auth", 'String'>;
    readonly email: Prisma.FieldRef<"Auth", 'String'>;
    readonly passwordHash: Prisma.FieldRef<"Auth", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Auth", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Auth", 'DateTime'>;
}
export type AuthFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where: Prisma.AuthWhereUniqueInput;
};
export type AuthFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where: Prisma.AuthWhereUniqueInput;
};
export type AuthFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where?: Prisma.AuthWhereInput;
    orderBy?: Prisma.AuthOrderByWithRelationInput | Prisma.AuthOrderByWithRelationInput[];
    cursor?: Prisma.AuthWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AuthScalarFieldEnum | Prisma.AuthScalarFieldEnum[];
};
export type AuthFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where?: Prisma.AuthWhereInput;
    orderBy?: Prisma.AuthOrderByWithRelationInput | Prisma.AuthOrderByWithRelationInput[];
    cursor?: Prisma.AuthWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AuthScalarFieldEnum | Prisma.AuthScalarFieldEnum[];
};
export type AuthFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where?: Prisma.AuthWhereInput;
    orderBy?: Prisma.AuthOrderByWithRelationInput | Prisma.AuthOrderByWithRelationInput[];
    cursor?: Prisma.AuthWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.AuthScalarFieldEnum | Prisma.AuthScalarFieldEnum[];
};
export type AuthCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AuthCreateInput, Prisma.AuthUncheckedCreateInput>;
};
export type AuthCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.AuthCreateManyInput | Prisma.AuthCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AuthCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    data: Prisma.AuthCreateManyInput | Prisma.AuthCreateManyInput[];
    skipDuplicates?: boolean;
};
export type AuthUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AuthUpdateInput, Prisma.AuthUncheckedUpdateInput>;
    where: Prisma.AuthWhereUniqueInput;
};
export type AuthUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.AuthUpdateManyMutationInput, Prisma.AuthUncheckedUpdateManyInput>;
    where?: Prisma.AuthWhereInput;
    limit?: number;
};
export type AuthUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.AuthUpdateManyMutationInput, Prisma.AuthUncheckedUpdateManyInput>;
    where?: Prisma.AuthWhereInput;
    limit?: number;
};
export type AuthUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where: Prisma.AuthWhereUniqueInput;
    create: Prisma.XOR<Prisma.AuthCreateInput, Prisma.AuthUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.AuthUpdateInput, Prisma.AuthUncheckedUpdateInput>;
};
export type AuthDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
    where: Prisma.AuthWhereUniqueInput;
};
export type AuthDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AuthWhereInput;
    limit?: number;
};
export type AuthDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.AuthSelect<ExtArgs> | null;
    omit?: Prisma.AuthOmit<ExtArgs> | null;
};
