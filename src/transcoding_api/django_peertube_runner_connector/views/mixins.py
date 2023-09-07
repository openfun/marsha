from django.core.paginator import Paginator
from rest_framework.response import Response


class ListMixin:
    """
    Mixin that replicates the Peertube list API.
    """

    def list(self, request, *args, **kwargs):
        start = int(request.query_params.get("start", 0))
        count = int(request.query_params.get("count", 15))
        sort = request.query_params.get("sort", "-createdAt")

        queryset = self.filter_queryset(self.get_queryset())
        runners = queryset.order_by(sort)

        paginator = Paginator(runners, count)
        runners_page = paginator.page(start + 1)
        serializer = self.get_serializer(runners_page, many=True)
        return Response(
            {
                "data": serializer.data,
                "total": paginator.count,
            }
        )
