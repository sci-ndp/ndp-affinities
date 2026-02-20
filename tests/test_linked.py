def _seed_graph(client):
    dataset = client.post("/datasets", json={"title": "Dataset Alpha"}).json()
    endpoint_1 = client.post("/ep", json={"kind": "OGC", "url": "https://ep-1"}).json()
    endpoint_2 = client.post("/ep", json={"kind": "API", "url": "https://ep-2"}).json()
    service_1 = client.post("/services", json={"type": "transform"}).json()
    service_2 = client.post("/services", json={"type": "analyze"}).json()

    client.post("/dataset-endpoints", json={"dataset_uid": dataset["uid"], "endpoint_uid": endpoint_1["uid"]})
    client.post("/dataset-services", json={"dataset_uid": dataset["uid"], "service_uid": service_1["uid"]})
    client.post("/service-endpoints", json={"service_uid": service_1["uid"], "endpoint_uid": endpoint_1["uid"]})
    client.post("/affinities", json={
        "dataset_uid": dataset["uid"],
        "endpoint_uids": [endpoint_1["uid"], endpoint_2["uid"]],
        "service_uids": [service_1["uid"], service_2["uid"]],
    })

    return dataset, endpoint_1, endpoint_2, service_1, service_2


def test_get_linked_for_dataset(client):
    dataset, endpoint_1, endpoint_2, service_1, service_2 = _seed_graph(client)

    response = client.get(f"/linked/{dataset['uid']}")
    assert response.status_code == 200
    body = response.json()

    endpoint_uids = {item["uid"] for item in body["endpoints"]}
    service_uids = {item["uid"] for item in body["services"]}

    assert body["input_type"] == "dataset"
    assert body["datasets"] == []
    assert endpoint_1["uid"] in endpoint_uids
    assert endpoint_2["uid"] in endpoint_uids
    assert service_1["uid"] in service_uids
    assert service_2["uid"] in service_uids


def test_get_linked_for_endpoint(client):
    dataset, endpoint_1, endpoint_2, service_1, service_2 = _seed_graph(client)

    response = client.get(f"/linked/{endpoint_1['uid']}")
    assert response.status_code == 200
    body = response.json()

    dataset_uids = {item["uid"] for item in body["datasets"]}
    endpoint_uids = {item["uid"] for item in body["endpoints"]}
    service_uids = {item["uid"] for item in body["services"]}

    assert body["input_type"] == "endpoint"
    assert dataset["uid"] in dataset_uids
    assert endpoint_1["uid"] not in endpoint_uids
    assert endpoint_2["uid"] in endpoint_uids
    assert service_1["uid"] in service_uids
    assert service_2["uid"] in service_uids


def test_get_linked_for_service(client):
    dataset, endpoint_1, endpoint_2, service_1, service_2 = _seed_graph(client)

    response = client.get(f"/linked/{service_1['uid']}")
    assert response.status_code == 200
    body = response.json()

    dataset_uids = {item["uid"] for item in body["datasets"]}
    endpoint_uids = {item["uid"] for item in body["endpoints"]}
    service_uids = {item["uid"] for item in body["services"]}

    assert body["input_type"] == "service"
    assert dataset["uid"] in dataset_uids
    assert endpoint_1["uid"] in endpoint_uids
    assert endpoint_2["uid"] in endpoint_uids
    assert service_1["uid"] not in service_uids
    assert service_2["uid"] in service_uids


def test_get_linked_not_found(client):
    response = client.get("/linked/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
