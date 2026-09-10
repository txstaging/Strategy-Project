namespace Mod.APIs.Extensions
{
    public static class ExpressionExtensions
    {
        public static Expression<Func<T, bool>> And<T>(this Expression<Func<T, bool>> first, Expression<Func<T, bool>> second)
        {
            var parameter = Expression.Parameter(typeof(T), "x");

            var visitor = new ReplaceParameterVisitor();
            visitor.Add(first.Parameters[0], parameter);
            visitor.Add(second.Parameters[0], parameter);

            var combined = visitor.Visit(Expression.AndAlso(first.Body, second.Body));

            return Expression.Lambda<Func<T, bool>>(combined, parameter);
        }

        private class ReplaceParameterVisitor : ExpressionVisitor
        {
            private readonly Dictionary<ParameterExpression, ParameterExpression> _map = new();

            public void Add(ParameterExpression from, ParameterExpression to)
            {
                _map[from] = to;
            }

            protected override Expression VisitParameter(ParameterExpression node)
            {
                if (_map.TryGetValue(node, out var replacement))
                {
                    node = replacement;
                }
                return base.VisitParameter(node);
            }
        }
    }
}
